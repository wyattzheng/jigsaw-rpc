import DomainClient from "../network/domain/client/DomainClient";
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

import IDomainClient from "src/network/domain/client/IDomainClient";
import assert from "assert";


interface JigsawEvent{
    ready:()=>void;
    close:()=>void;
}

type HandlerRet = Promise<object> | Promise<void>  | object | void;
type Handler = (data : object) => HandlerRet;
type FinalHandler = (port_name:string,data:object)=> object | void;

class SimpleJigsaw extends TypedEmitter<JigsawEvent> implements IJigsaw{
    private state = "starting"; // starting ready closing close

    public jgname : string;
    private domclient? : IDomainClient;
    
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

    constructor(jgname:string,entry_address:string,entry_port:number | undefined,registry_path:Url.Url){
        super();

        if(!registry_path.hostname)
            throw new Error("regsitry_path.hostname must be specified");
        if(!registry_path.port)
            throw new Error("regsitry_path.port must be specified");

        this.jgname = jgname;
        this.entry_address = entry_address;
        this.entry_port = entry_port;

        this.registry_path = registry_path;

        let socket = new UDPSocket(this.entry_port,"0.0.0.0");
        this.socket = socket;

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

        this.router.getEventEmitter().on("close",()=>{
            this.setModuleClose("router");
            this.close();
        });

        this.socket.on("ready",()=>{
            this.domclient = new DomainClient(this.jgname,this.entry_address,this.socket.getAddress().port,
                new AddressInfo(registry_addr,registry_port)
            ,this.router as IRouter);
                    
            this.domclient.getEventEmitter().on("close",()=>{
                this.setModuleClose("domclient");
                this.close();
            });
            if(this.domclient.getState() == "ready"){
                this.setModuleReady("domclient");
            }else
                this.domclient.getEventEmitter().on("ready",()=>{
                    this.setModuleReady("domclient");
                });
                

        })

    
        this.router.getEventEmitter().on("ready",()=>{
            this.setModuleReady("router");
        });
       


    }
    private setModuleReady(name:string){
        if(this.state != "starting")
            throw new Error("not a correct state");

        this.module_ref.add(name);

        if(this.module_ref.size == 2){
            this.state="ready";
            this.emit("ready");
        }
    }
    private setModuleClose(name:string){
        if(this.state != "closing")
            throw new Error("not at closing state, but module closed");
        
        this.module_ref.delete(name);
        
        if(this.module_ref.size == 0){
            this.state = "close";
            this.emit("close");
        }

    }
    private async handleInvoke(path:Path,data : Buffer) : Promise<Buffer>{
        let req_data = JSON.parse(data.toString());

        let port_handler = this.port_handlers.get(path.method) as Handler;
        
        let ret_data;
        if(!this.port_handlers.has(path.method)){
            ret_data = await this.final_handler(path.method,req_data);
        }else{
            ret_data = await port_handler(req_data);
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
        if(this.state == "starting")
            throw new Error("this instance is starting.");

        if(this.state == "closing" || this.state == "close")
            return;
        if(this.state != "ready")
            throw new Error("at this state, the jigsaw can not be closed");

        this.state = "closing";
        
        //this.router.close();
        await (this.domclient as IDomainClient).close();   

        this.socket.close();

    }
    
    send(path_str:string,data:object) : Promise<object>{
        assert(this.state == "ready", "jigsaw state must be ready");
        
        let validator = new DataValidator(data);
        validator.validate();

        let path = Path.fromString(path_str);
        return this.doSend(path,data);
    }
    private async doSend(path:Path,data:object){

        let req_seq = this.request_seq++;
        
        let buffer = Buffer.from(JSON.stringify(data));
        let request = new InvokeRequest(this.jgname,path,buffer,this.domclient as IDomainClient,this.router as IRouter,req_seq);
        
        await request.whenBuild();
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