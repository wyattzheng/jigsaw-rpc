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

import IRegistryClient from "src/network/domain/client/IRegistryClient";
import assert from "assert";
import LifeCycle from "../utils/LifeCycle";
import VariableOption from "./option/VariableOption";


interface JigsawEvent{
    ready:()=>void;
    closed:()=>void;
}

type HandlerRet = Promise<object> | Promise<void>  | object | void;
type Handler = (data:object,reply_info:VariableOption)=> HandlerRet
type FinalHandler = (port_name:string,data:object,reply_info:VariableOption)=> HandlerRet

class SimpleJigsaw extends TypedEmitter<JigsawEvent> implements IJigsaw{

    private lifeCycle = new LifeCycle();

    public jgname : string;
    private domclient? : IRegistryClient;
    
    private entry_address : string;
    private entry_port? : number;
    
    private registry_path : Url.Url;

    private router? : IRouter;
    
    private request_seq : number = 0;
    private port_handlers : Map<string,Handler> = new Map();
    private invoke_handler? : InvokeHandler;

    private final_handler : FinalHandler = ()=>{};
    private module_ref = new Set<string>();
    private socket : UDPSocket;

    constructor(option : VariableOption){
        super();
        let jgname = option.has("name") ? option.get("name") : SimpleJigsaw.getRandomName();

        let entry_option = option.has("entry") ? option.get("entry") : "127.0.0.1";
        let parsed_entry = AddressInfo.parse(entry_option);
    
        let entry_address = parsed_entry.address;
        let entry_port : number | undefined = parsed_entry.port > 0 ? parsed_entry.port : undefined;
    
        let registry_option = option.has("registry") ? option.get("registry") : "jigsaw://127.0.0.1:3793/";
        let registry_url = Url.parse(registry_option) as Url.Url;
    

        if(!registry_url.hostname)
            throw new Error("regsitry_path.hostname must be specified");
        if(!registry_url.port)
            throw new Error("regsitry_path.port must be specified");

        this.jgname = jgname;
        this.entry_address = entry_address;
        this.entry_port = entry_port;

        this.registry_path = registry_url;

        let socket = new UDPSocket(this.entry_port,"0.0.0.0");
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
            this.domclient = new DomainClient(this.jgname,this.entry_address,this.socket.getAddress().port,
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
    private async handleInvoke(path:Path,data : Buffer) : Promise<Buffer>{
        let req_data = JSON.parse(data.toString());
        
        let port_handler = this.port_handlers.get(path.method) as Handler;
        
        let ret_data;
        if(!this.port_handlers.has(path.method)){
            ret_data = await this.final_handler(path.method,req_data,VariableOption.from({}));
        }else{
            ret_data = await port_handler(req_data,VariableOption.from({}));
        }

        if(!ret_data)
            ret_data = {};
        
        return Buffer.from(JSON.stringify(ret_data as object));
    }
    static getRandomName(){
        let hash = Crypto.createHash("md5");
        hash.update(Math.random()+"");
        return `rand-${hash.digest("hex").substr(0,8)}`;
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
    
    async send(path_str:string,data:any,option = VariableOption.from({})) : Promise<object>{
        assert(this.lifeCycle.getState() == "ready", "jigsaw state must be ready");
        assert(typeof(data) == "object","data must be an object");

        let validator = new DataValidator(data);
        validator.validate();

        let path = Path.fromString(path_str);
        
        let req_seq = this.request_seq++;
        
        let buffer = Buffer.from(JSON.stringify(data));
        let request = new InvokeRequest(this.jgname,path,buffer,this.domclient as IRegistryClient,this.router as IRouter,req_seq);
        
        await request.getLifeCycle().when("ready");
        await request.run();
        let ret_buf = request.getResult();

        return JSON.parse(ret_buf.toString());

    }
    port(port_name:string,handler:Handler) : void{
        if(this.port_handlers.has(port_name))
            throw new Error("this port has already binded");

        this.port_handlers.set(port_name,handler);
    }
    unport(port_name:string){
        if(!this.port_handlers.has(port_name))
            throw new Error("this port hasn't been binded");

        this.port_handlers.delete(port_name);
    }
    handle(finalhandler:FinalHandler) : void{
        this.final_handler = finalhandler;

    }

}

export default SimpleJigsaw;