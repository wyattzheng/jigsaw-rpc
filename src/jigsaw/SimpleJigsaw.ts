import DomainClient from "../network/domain/client/RegistryClient";
import IJigsaw from "./IJigsaw";
import PacketFactory from "../network/protocol/factory/PacketFactory";
import PacketBuilderManager from "../network/protocol/builder/manager/PacketBuilderManager";
import UDPSocket from "../network/socket/UDPSocket";
import BuilderNetworkClient from "../network/client/BuilderNetworkClient";
import AddressInfo from "../network/domain/AddressInfo";
import RegistryServerInfo from "../network/domain/RegistryServerInfo";
import InvokeRequest from "../network/request/InvokeRequest";
import Path from "../network/request/Path";
import SimplePacketRouter from "../network/router/packetrouter/SimplePacketRouter";
import IRouter from "../network/router/IRouter";

import InvokeHandler from "../network/handler/InvokeHandler";
import Crypto from "crypto";
import DataValidator from "./DataValidator";
import Url from "url";
import { TypedEmitter } from "tiny-typed-emitter";

import IRegistryClient from "../network/domain/client/IRegistryClient";
import assert from "assert";
import LifeCycle from "../utils/LifeCycle";
import WorkFlow from "./WorkFlow";
import RandomGen from "../utils/RandomGen";

interface JigsawEvent{
    error:(err : Error)=>void;
    ready:()=>void;
    closed:()=>void;
}


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
    private invoke_handler? : InvokeHandler;

    private ref = 0;

    private socket : UDPSocket;

    private workflow = new WorkFlow();

    constructor(option : any){
        super();
        this.jgid = RandomGen.GetRandomHash(8);

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

        let socket = new UDPSocket(this.listen_port,"0.0.0.0");
        socket.start();

        this.socket = socket;

        this.lifeCycle.setState("starting");

        this.lifeCycle.when("ready").then(()=>this.emit("ready"));
        this.lifeCycle.on("closed",()=>this.emit("closed"));

        this.initSubModules();
    }
    private initSubModules(){
        let factory = new PacketFactory();
        let builder_manager = new PacketBuilderManager(factory);
        let client=new BuilderNetworkClient(this.socket,factory,builder_manager);
        client.getEventEmitter().on("error",(err:Error)=>{
            this.emit("error",err);
        });

        this.router = new SimplePacketRouter(client);


        this.invoke_handler = new InvokeHandler(this.router,this.handleInvoke.bind(this));


        this.socket.getLifeCycle().on("ready",async ()=>{
            let socket_port = this.socket.getAddress().port;
            let entry = new AddressInfo(this.entry.address,
                this.entry.port <= 0? socket_port : this.entry.port);
            
            this.domclient = new DomainClient(this.jgid,this.jgname,entry,
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
                this.lifeCycle.setState("ready");
            }
        }else if(this.lifeCycle.getState() == "closing"){
            assert(offset <= 0);
            if(this.ref == 0)
                this.lifeCycle.setState("closed");
        }
    }
    private async handleInvoke(path:Path,data : Buffer,isJSON:boolean,sender:string) : Promise<Buffer | object>{

        let workflow = this.workflow;
        let parsed = data;
        if(isJSON)
            parsed = JSON.parse(data.toString());
        

        let context = {
            result:{},

            method:path.method,
            sender,
            isJSON,
            data: parsed,
            rawdata:data,
            jigsaw:this
        }

        let ctx = await workflow.call(context);
        return ctx.result;
    }
    
    getName(){
        return this.jgname;
    }
    async close(){
        if(this.lifeCycle.getState() == "starting")
            throw new Error("this instance is starting.");

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
    
    async send(path_str:string,data:object | Buffer) : Promise<object | Buffer>{
        if(data instanceof Buffer)
            return this.call(path_str,data,false);
        else{
            let validator = new DataValidator(data);
            validator.validate();
            let buf = Buffer.from(JSON.stringify(data));
            let res = await this.call(path_str,buf,true);
            return res;
        }
    }
    
    private async call(path_str:string,data:Buffer,isJSON:boolean) : Promise<object | Buffer>{
        assert(this.lifeCycle.getState() == "ready", "jigsaw state must be ready");
        assert(typeof(data) == "object","data must be an object");


        let path = Path.fromString(path_str);
        
        let req_seq = this.request_seq++;
        this.setRef(+1);
        try{
            let request = new InvokeRequest(this.jgname,path,data,isJSON,this.domclient as IRegistryClient,this.router as IRouter,req_seq);
            request.getLifeCycle().on("closed",()=>{
                this.setRef(-1);
            })

            await request.getLifeCycle().when("ready");
            await request.run();    
            if(request.isResultJSON()){
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

        this.workflow.pushWork(handler);
    }
    port(port_name : string , handler:(data:object,ctx:any)=>Promise<object | Buffer>) : void{
        this.use(async (ctx,next)=>{
            if(ctx.method == port_name)
               ctx.result = await handler(ctx.data,ctx);

            await next();
        });
    }

}

export default SimpleJigsaw;