import LifeCycle from "../utils/LifeCycle";
import ISocket from "../network/socket/ISocket";
import RegistryServerInfo from "../network/domain/RegistryServerInfo";
import AddressInfo from "../network/domain/AddressInfo";
import WorkFlow from "./context/WorkFlow";
import PacketFactory from "../network/protocol/factory/PacketFactory";
import INetworkClient from "../network/client/INetworkClient";
import IRouter from "../network/router/IRouter";
import RandomGen from "../utils/RandomGen";
import Path from "../network/request/Path";
import IHandler from "../network/handler/IHandler";

import { UseContext } from "./context/Context";
import { UseWare } from "./JigsawWare";
import { IRegistryUpdater } from "../network/domain/client/IRegistryUpdater";

import { IRegistryResolver } from "../network/domain/client/IRegistryResolver";
import { JigsawModuleOption, JigsawOption } from "./JigsawOption";
import { TypedEmitter } from "tiny-typed-emitter";

import assert from "assert";
import { NetComponent, NetFactory } from "./NetFactory";

export interface ProviderEvent{
    error(err : Error) : void;
}

export class SimpleProvider extends TypedEmitter<ProviderEvent>{
    private lifeCycle = new LifeCycle();
    private socket? : ISocket;
    private resolver? : IRegistryResolver;
    private modules : JigsawModuleOption;
    private option : JigsawOption;
    private listen_port? : number;
    private entry : AddressInfo; 
    private registry : RegistryServerInfo;
    private invoke_handler? : IHandler;

    private updater? : IRegistryUpdater;    

    private recv_workflow = new WorkFlow<UseContext>();

    private client? : INetworkClient;
    private router? : IRouter;

    private jgid : string;
    private jgname : string;

    private factory : NetFactory;

    constructor(jgid:string , option:JigsawOption,modules:JigsawModuleOption){
        super();

        this.option = option;
        this.jgid = jgid;
        this.jgname = option.name || "";

        this.modules = modules;

        let entry_str : string = option.entry || "127.0.0.1";
        this.entry = AddressInfo.parse(entry_str);
        this.registry = RegistryServerInfo.parse(option.registry || "jigsaw://127.0.0.1:3793/");
        
        this.listen_port = option.listen_port;

        this.factory = new NetFactory(this.modules,(err)=>this.emit("error",err));

    }
    getLifeCyle(){
        return this.lifeCycle;
    }
    async start(public_net:NetComponent){
        if(this.lifeCycle.getState()!="closed")
            throw new Error(`current state must be closed`);

        this.lifeCycle.setState("starting");

        this.socket = public_net.socket;
        this.client = public_net.client;
        this.router = public_net.router;


        await this.initHandler();
        await this.initUpdater();
   
        this.lifeCycle.setState("ready");

    }
    private async initHandler(){
        this.invoke_handler = new this.modules.InvokeHandler(this.router,this.handleInvoking.bind(this));
    }

    private async initUpdater(){
        let socket_port = (this.socket as ISocket).getAddress().port;
        let entry = new AddressInfo(this.entry.address,this.entry.port <= 0 ? socket_port : this.entry.port);
        
        this.updater = new this.modules.RegistryUpdater(this.jgid,this.jgname,entry,this.registry,this.router);
        this.updater.on("error",(err)=>this.emit("error",err));
        await this.updater.getLifeCycle().when("ready");
    }
    private async handleInvoking(path:Path,data : Buffer,isJSON:boolean,sender:string,reply_info:AddressInfo) : Promise<Buffer | Object>{

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
            sender
        };

        let ctx = await this.recv_workflow.call(context);

        return ctx.result;
    }

    use(handler : UseWare,hash?:string) : void{
        assert(typeof(handler) == "function","handler must be a function");

        this.recv_workflow.pushWork(handler,hash || RandomGen.GetRandomHash(10));
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
        assert(this.lifeCycle.getState() == "ready", "jigsaw state must be ready");

        return this.socket as ISocket;
    }
    getRouter(){
        assert(this.lifeCycle.getState() == "ready", "jigsaw state must be ready");

        return this.router as IRouter;
    }
    async close(){
              
        await this.updater?.close();

        await this.invoke_handler?.close();

        
    }
}