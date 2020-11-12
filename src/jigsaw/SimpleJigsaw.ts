import DomainClient from "../network/domain/client/RegistryClient";
import IJigsaw from "./IJigsaw";
import PacketFactory from "../network/protocol/factory/PacketFactory";
import PacketBuilderManager from "../network/protocol/builder/manager/PacketBuilderManager";
import UDPSocket from "../network/socket/UDPSocket";
import BuilderNetworkClient from "../network/client/BuilderNetworkClient";
import AddressInfo from "../network/domain/AddressInfo";
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

    private option_entries : Array<string> ; 
    private listen_port? : number;
    
    private registry_path : Url.Url;

    private router? : IRouter;
    
    private request_seq : number = 0;
    private invoke_handler? : InvokeHandler;

    private module_ref = new Set<string>();
    private socket : UDPSocket;

    private workflow = new WorkFlow();

    constructor(option : any){
        super();
        this.jgid = RandomGen.GetRandomHash(8);

        let jgname = option.name || "";

        let entry_option = [];
        if(typeof(option.entry) == "string"){
            entry_option = [option.entry]
        }else if(option.entry instanceof Array){           
            entry_option = option.entry;
        }else{
            entry_option = ["127.0.0.1"];
        }


        let listen_port = option.port;

        let registry_option = option.registry || "jigsaw://127.0.0.1:3793/";
        let registry_url = Url.parse(registry_option) as Url.Url;
    

        if(!registry_url.hostname)
            throw new Error("regsitry_path.hostname must be specified");
        if(!registry_url.port)
            throw new Error("regsitry_path.port must be specified");

        this.jgname = jgname;
        this.option_entries = entry_option;

        this.listen_port = listen_port;

        this.registry_path = registry_url;

        let socket = new UDPSocket(this.listen_port,"0.0.0.0");
        this.socket = socket;

        this.lifeCycle.when("ready").then(()=>this.emit("ready"));
        this.lifeCycle.on("closed",()=>this.emit("closed"));

        this.initSubModules();
    }
    private initSubModules(){
        let factory = new PacketFactory();
        let builder_manager = new PacketBuilderManager(factory);
        let client=new BuilderNetworkClient(this.socket,factory,builder_manager);
        this.router = new SimplePacketRouter(client);

        let registry_addr = this.registry_path.hostname as string;
        let registry_port = parseInt(this.registry_path.port as string) || 3793;

        this.invoke_handler = new InvokeHandler(this.router,this.handleInvoke.bind(this));


        this.socket.getLifeCycle().on("ready",async ()=>{
            let socket_port = this.socket.getAddress().port;
            let entries = this.option_entries.map((x)=>{
                let parsed = AddressInfo.parse(x);
                if(parsed.port <= 0)
                    parsed.port = socket_port;
                return parsed;
            });

            
            this.domclient = new DomainClient(this.jgid,this.jgname,entries,socket_port,
                new AddressInfo(registry_addr,registry_port)
            ,this.router as IRouter);
                    

            this.domclient.getLifeCycle().on("closed",()=>{
                this.setModuleClose("domclient");
                this.close();    
            });

            this.domclient.getLifeCycle().when("ready").then(()=>{
                this.setModuleReady("domclient");
            });  
    
        })
    
        
        this.router.getLifeCycle().on("closed",()=>{
            this.setModuleClose("router");
            this.close();
        });
        
        this.router.getLifeCycle().when("ready").then(()=>{
            this.setModuleReady("router");
        });
       


    }
    private setModuleReady(name:string){
        if(this.lifeCycle.getState() != "starting")
            throw new Error("not a correct state");

        this.module_ref.add(name);

        if(this.module_ref.size == 2){
            this.lifeCycle.setState("ready")
        }
    }
    private setModuleClose(name:string){
        if(this.lifeCycle.getState() != "closing")
            throw new Error("not at closing state, but module closed");
        
        this.module_ref.delete(name);
        
        if(this.module_ref.size == 0){

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
        
        //this.router.close();
        await (this.domclient as IRegistryClient).close();   

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
        
        let request = new InvokeRequest(this.jgname,path,data,isJSON,this.domclient as IRegistryClient,this.router as IRouter,req_seq);
        
        await request.getLifeCycle().when("ready");
        await request.run();
        if(request.isResultJSON()){
            return JSON.parse(request.getResult().toString());
        }else{
            return request.getResult();
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