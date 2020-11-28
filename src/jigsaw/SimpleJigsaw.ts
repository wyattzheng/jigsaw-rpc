import IJigsaw from "./IJigsaw";
import PacketFactory from "../network/protocol/factory/PacketFactory";
import AddressInfo from "../network/domain/AddressInfo";
import RegistryServerInfo from "../network/domain/RegistryServerInfo";
import Path from "../network/request/Path";

import DataValidator from "./DataValidator";
import { TypedEmitter } from "tiny-typed-emitter";

import assert from "assert";
import LifeCycle from "../utils/LifeCycle";
import WorkFlow from "./context/WorkFlow";
import RandomGen from "../utils/RandomGen";

import IRegistryClient from "../network/domain/client/IRegistryClient";
import IRoute from "../network/router/route/IRoute";
import IRouter from "../network/router/IRouter";
import ISocket from "../network/socket/ISocket";
import IHandler from "../network/handler/IHandler";
import {UseContext,PreContext,PostContext} from "./context/Context";
import {UseWare,PreWare,PostWare} from "./JigsawWare";
import {JigsawOption,JigsawModuleOption} from "./JigsawOption";

interface JigsawEvent{
    error:(err : Error)=>void;
    ready:()=>void;
    closed:()=>void;
}



type NextFunction = ()=>Promise<void>;

class SimpleJigsaw extends TypedEmitter<JigsawEvent> implements IJigsaw{

    private lifeCycle = new LifeCycle();

    private jgid : string;
    private jgname : string;
    private domclient? : IRegistryClient;

    private entry : AddressInfo ; 
    private listen_port? : number;
    
    private registry : RegistryServerInfo;

    private router? : IRouter;
    
    private request_seq : number = 0;
    private invoke_handler? : IHandler;

    private ref = 0;

    private socket : ISocket;

    private recv_workflow = new WorkFlow<UseContext>();
    private pre_workflow = new WorkFlow<PreContext>();
    private post_workflow = new WorkFlow<PostContext>();

    private option : any;
    private modules : JigsawModuleOption;

    constructor(option : JigsawOption,modules : JigsawModuleOption){
        super();
        this.jgid = RandomGen.GetRandomHash(8);
        this.option = option;
        this.modules = modules;

        let jgname = option.name || "";

        // ============ENTRY=============

        let entry_str : string = option.entry || "127.0.0.1";
        this.entry = AddressInfo.parse(entry_str);

        // ===============================


        // ============REGSERVER==========

        this.registry = RegistryServerInfo.parse(option.registry || "jigsaw://127.0.0.1:3793/");
        
        // ============REGSERVER==========

        let listen_port = option.port;
        this.listen_port = listen_port;

    

        this.jgname = jgname;

        let socket = new this.modules.Socket(this.listen_port,"0.0.0.0");
        socket.start();
        socket.getEventEmitter().on("error",(err)=>{
            this.emit("error",err);
        });

        this.socket = socket;

        this.lifeCycle.setState("starting");

        this.lifeCycle.when("ready").then(()=>this.emit("ready"));
        this.lifeCycle.on("closed",()=>this.emit("closed"));

        this.initSubModules();
    }
    private initSubModules(){
        let factory = new PacketFactory();
        let builder_manager = new this.modules.BuilderManager(factory);
        let client=new this.modules.NetworkClient(this.socket,factory,builder_manager);
        client.getEventEmitter().on("error",(err:Error)=>{
            this.emit("error",err);
        });

        this.router = new this.modules.PacketRouter(client);


        this.invoke_handler = new this.modules.InvokeHandler(this.router,this.handleInvoke.bind(this));


        this.socket.getLifeCycle().on("ready",async ()=>{
            let socket_port = this.socket.getAddress().port;
            let entry = new AddressInfo(this.entry.address,
                this.entry.port <= 0? socket_port : this.entry.port);
            
            this.domclient = new this.modules.RegistryClient(this.jgid,this.jgname,entry,
                this.registry
            ,this.router as IRouter);
                    

            this.domclient.getLifeCycle().on("closed",()=>{
                this.close();    
            });

            this.domclient.getLifeCycle().when("ready").then(()=>{
                this.setRef(+1);
            });
    
        })
    
        
        this.router.getLifeCycle().on("closed",()=>{
            this.close();
        });
        
        this.router.getLifeCycle().when("ready").then(()=>{
            this.setRef(+1);
        });
       


    }
    private setRef(offset : number){
        this.ref+=offset;

        if(this.lifeCycle.getState() == "starting"){
            assert(offset >= 0);
            if(this.ref == 2){
                this.socket.setEmitting(true);
                this.lifeCycle.setState("ready");
            }
        }else if(this.lifeCycle.getState() == "closing"){
            assert(offset <= 0);
            if(this.ref == 0)
                this.lifeCycle.setState("closed");
        }
    }
    private async handleInvoke(path:Path,data : Buffer,isJSON:boolean,sender:string,reply_info:AddressInfo) : Promise<Buffer | Object>{

        let parsed : any = data;
        if(isJSON)
            parsed = JSON.parse(data.toString());
        
        let context : UseContext = {
            result:{},

            method:path.method,
            isJSON,
            data: parsed,
            rawdata:data,
            reply_info,
            sender,
            jigsaw:this,
        };
        
        let ctx = await this.recv_workflow.call(context);
        
        return ctx.result;
    }
    getOption(){
        return this.option;
    }
    getName(){
        return this.jgname;
    }    
    getAddress(){
        return this.socket.getAddress();
    }
    public getRegistryClient(){
        assert(this.lifeCycle.getState() == "ready","jigsaw state must be ready");

        return this.domclient as IRegistryClient;
    }

    async send(path_str:string,data:any = {}) : Promise<any>{

        let path = Path.fromString(path_str);
        let route = new this.modules.DefaultRoute(path.regpath,this.getRegistryClient());

        let pre_raw_ctx : PreContext = {
            rawdata : data,
            rawpathstr : path_str,
            rawroute : route,
            data:data,
            pathstr:path_str,
            route:route,
        };

        let pre_ctx = await this.pre_workflow.call(pre_raw_ctx);

        let result : any; 
        try{
            result = await this.call(Path.fromString(pre_ctx.pathstr),pre_ctx.route,pre_ctx.data);
        }catch(err){
            result = err;
        }

        let post_raw_ctx : PostContext = {
            pathstr : path_str,
            data : data,
            result : result,
        }
        
        let post_ctx = await this.post_workflow.call(post_raw_ctx);

        if(post_ctx.result instanceof Error)
            throw post_ctx.result;

        return post_ctx.result;

    }
    public async call(path:Path,route:IRoute,data:any) : Promise<any>{
        assert(this.lifeCycle.getState() == "ready", "jigsaw state must be ready");

        let isJSON = false;
        let buf = Buffer.allocUnsafe(0);
        if(data instanceof Buffer){
            isJSON = false;
            buf = data;

        }
        else{
            let validator = new DataValidator(data);
            validator.validate();

            isJSON = true;
            buf = Buffer.from(JSON.stringify(data));            
        }        
        

        let req_seq = this.request_seq++;
        this.setRef(+1);
        try{


            let request = new this.modules.InvokeRequest(this.jgname,path,buf,isJSON,route,this.router as IRouter,req_seq);

            request.getLifeCycle().on("closed",()=>{
                this.setRef(-1);
            })

            await request.getLifeCycle().when("ready");
            await request.run();

            if(request.getResultType() == 1){
                return JSON.parse(request.getResult().toString());
            }else{
                return request.getResult();
            }    
        }catch(err){
            throw err
        }finally{

        }
    }
    
    use(handler : UseWare,hash?:string) : void{
        assert(typeof(handler) == "function","handler must be a function");

        this.recv_workflow.pushWork(handler,hash || RandomGen.GetRandomHash(10));
    }
    pre(handler : PreWare,hash?:string) : void{
        assert(typeof(handler) == "function","handler must be a function");

        this.pre_workflow.pushWork(handler,hash || RandomGen.GetRandomHash(10));

    }
    post(handler : PostWare,hash?:string) : void{
        assert(typeof(handler) == "function","handler must be a function");

        this.post_workflow.pushWork(handler,hash || RandomGen.GetRandomHash(10));
    }
    
    port(port_name : string , handler:(data:any,ctx:UseContext)=>any) : void{
        this.use(async (ctx,next)=>{
            if(ctx.method == port_name){
                let result = await handler(ctx.data,ctx);
                if(result == undefined)
                    ctx.result = null;
                else
                    ctx.result = result;

            }

            await next();
        });
    }
    getSocket(){
        return this.socket;
    }
    setSocket(socket : ISocket){
        this.socket = socket;
    }
    async close(){
        if(this.lifeCycle.getState() == "starting"){
            throw new Error("this instance is starting.");
        }
        if(this.lifeCycle.getState() == "closing" || this.lifeCycle.getState() == "closed")
            return;
        if(this.lifeCycle.getState() != "ready")
            throw new Error("at this state, the jigsaw can not be closed");

        
        this.lifeCycle.setState("closing");
        
        await this.invoke_handler?.close();
        await (this.domclient as IRegistryClient).close();   
        await this.router?.close();
        this.socket.close();

    }
}

export default SimpleJigsaw;