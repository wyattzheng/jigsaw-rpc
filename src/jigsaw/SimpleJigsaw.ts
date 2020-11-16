import IJigsaw from "./IJigsaw";
import PacketFactory from "../network/protocol/factory/PacketFactory";
import AddressInfo from "../network/domain/AddressInfo";
import RegistryServerInfo from "../network/domain/RegistryServerInfo";
import Path from "../network/request/Path";

import DataValidator from "./DataValidator";
import { TypedEmitter } from "tiny-typed-emitter";

import assert from "assert";
import LifeCycle from "../utils/LifeCycle";
import WorkFlow from "./WorkFlow";
import RandomGen from "../utils/RandomGen";

import IRegistryClient from "../network/domain/client/IRegistryClient";
import IRoute from "../network/router/route/IRoute";
import IRouter from "../network/router/IRouter";
import ISocket from "../network/socket/ISocket";
import IHandler from "../network/handler/IHandler";
import IRequest from "../network/request/IRequest";
import INetworkClient from "../network/client/INetworkClient";
import IBuilderManager from "../network/protocol/builder/manager/IBuilderManager";
import SlicePacket from "../network/protocol/packet/SlicePacket";
import IPacket from "../network/protocol/IPacket";

interface JigsawEvent{
    error:(err : Error)=>void;
    ready:()=>void;
    closed:()=>void;
}

type JigsawModuleOption = {
    Socket:new (...args:any[])=> ISocket,
    PacketRouter:new (...args:any[])=> IRouter,
    InvokeHandler:new (...args:any[])=> IHandler,
    InvokeRequest:new (...args:any[])=> IRequest<Buffer>,
    NetworkClient:new (...args:any[])=> INetworkClient,
    RegistryClient:new (...args:any[]) => IRegistryClient,
    BuilderManager:new (...args:any[]) => IBuilderManager<SlicePacket,IPacket>,
    DefaultRoute:new (...args:any[]) => IRoute,

};

type NextFunction = ()=>Promise<void>;
type WorkFunction = (ctx:any,next:NextFunction)=>Promise<void>;

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

    private recv_workflow = new WorkFlow();
    private send_workflow = new WorkFlow();
    private option : any;
    private modules : JigsawModuleOption;

    constructor(option : any,modules : JigsawModuleOption){
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
    private async handleInvoke(path:Path,data : Buffer,isJSON:boolean,sender:string,reply_info:AddressInfo) : Promise<Buffer | object>{

        let workflow = this.recv_workflow;
        let parsed = data;
        if(isJSON)
            parsed = JSON.parse(data.toString());
        

        let context = {
            result:{},

            method:path.method,
            isJSON,
            data: parsed,
            rawdata:data,
            reply_info,
            sender,
            jigsaw:this,
        }

        let ctx = await workflow.call(context);
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

    async send(path_str:string,data:object | Buffer) : Promise<object | Buffer>{
        
        let path = Path.fromString(path_str);
        let route = new this.modules.DefaultRoute(path.regpath,this.getRegistryClient());

        let context = {
            raw:{
                data : data,
                pathstr : path_str,
                route : route
            },

            data:data,
            pathstr:path_str,
            route:route,
        };

        let ctx = await this.send_workflow.call(context);
        return this.call(Path.fromString(ctx.pathstr),ctx.route,ctx.data);

    }
    public async call(path:Path,route:IRoute,data:object | Buffer) : Promise<object | Buffer>{
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
    
    use(handler : WorkFunction) : void{
        assert(typeof(handler) == "function","handler must be a function");

        this.recv_workflow.pushWork(handler);
    }
    pre(handler : WorkFunction) : void{
        assert(typeof(handler) == "function","handler must be a function");

        this.send_workflow.pushWork(handler);
    }
    port(port_name : string , handler:(data:object,ctx:any)=>Promise<object | Buffer>) : void{
        this.use(async (ctx,next)=>{
            if(ctx.method == port_name)
               ctx.result = await handler(ctx.data,ctx);

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