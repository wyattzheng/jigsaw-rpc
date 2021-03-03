import LifeCycle from "../utils/LifeCycle";
import DataValidator from "./DataValidator";

import WorkFlow from "./context/WorkFlow";

import IRoute from "../network/router/route/IRoute";

import { JigsawModuleOption, JigsawOption } from "./JigsawOption";
import { PreContext, PostContext } from "./context/Context";
import { PreWare, PostWare } from "./JigsawWare";
import { AsyncManager } from "../utils/AsyncManager";
import { parseJigsawURL } from "./JigsawURL";

import RegistryServerInfo from "../network/domain/RegistryServerInfo";
import RandomGen from "../utils/RandomGen";
import DomainCacheStorage from "../network/domain/client/QueryCacheStorage";
import Path from "../network/request/Path";
import IRouter from "../network/router/IRouter";
import ISocket from "../network/socket/ISocket";
import INetworkClient from "../network/client/INetworkClient";
import AddressInfo from "../network/domain/AddressInfo";
import NetRoute from "../network/router/route/NetRoute";

import assert from "assert";

import { TypedEmitter } from "tiny-typed-emitter";
import { IRegistryResolver } from "../network/domain/client/IRegistryResolver";
import { NetComponent, NetFactory } from "./NetFactory"

interface InvokerEvent{
    error:(err : Error)=>void;
}

export class SimpleInvoker extends TypedEmitter<InvokerEvent>{
    private lifeCycle = new LifeCycle();
    
    private jgid:string;
    private jgname : string;

    private option:JigsawOption;
    private modules:JigsawModuleOption;
    private registry : RegistryServerInfo;

    private pre_workflow = new WorkFlow<PreContext>();
    private post_workflow = new WorkFlow<PostContext>();

    private request_async_manager = new AsyncManager();
    private domain_cache =  new DomainCacheStorage();

    private request_seq : number = 0;


    private socket?:ISocket;
    private router?:IRouter;
    private client?:INetworkClient;
    private resolver?:IRegistryResolver;
    private factory:NetFactory;

    constructor(jgid:string , option:JigsawOption,modules:JigsawModuleOption){
        super();

        this.jgid = jgid;
        this.jgname = option.name || "";

        this.option = option;
        this.modules = modules;

        this.registry = RegistryServerInfo.parse(option.registry || "jigsaw://127.0.0.1:3793/");
        
        this.lifeCycle.setState("starting");

        this.factory = new NetFactory(this.modules,(err)=>this.emit("error",err));

    }
    async start(public_net:NetComponent){

        this.socket = public_net.socket;
        this.client = public_net.client;
        this.router = public_net.router;

        this.resolver = await this.factory.getNewResolver(this.registry,this.router,this.domain_cache);

        this.lifeCycle.setState("ready");
    }




    private buildBufferAndSend(path:Path,route:IRoute,router:IRouter,data:any){
        let isJSON = false;
        let buf = Buffer.allocUnsafe(0);
        if(data instanceof Buffer){
            isJSON = false;
            buf = data;

        }else{
            let validator = new DataValidator(data);
            validator.validate();

            isJSON = true;
            buf = Buffer.from(JSON.stringify(data));           
        }

        return this.sendRequest(path,buf,isJSON,route,router);
    }
    private async sendRequest(path:Path,buf:Buffer,isJSON:boolean,route:IRoute,router:IRouter){
        let req_seq = this.request_seq++;
        this.request_async_manager.setRef(+1);

        let request = new this.modules.InvokeRequest(this.jgname,path,buf,isJSON,route,router,req_seq);

        request.getLifeCycle().on("closed",()=>{
            this.request_async_manager.setRef(-1);
        });

        await request.getLifeCycle().when("ready");
        try{
            await request.run();
        }catch(err){
            throw err
        }finally{
            await request.getLifeCycle().when("closed");
        }

        if(request.getResultType() == 1){
            return JSON.parse(request.getResult().toString());
        }else{
            return request.getResult();
        }    
    }

    pre(handler : PreWare,hash?:string) : void{
        assert(typeof(handler) == "function","handler must be a function");

        this.pre_workflow.pushWork(handler,hash || RandomGen.GetRandomHash(10));

    }
    post(handler : PostWare,hash?:string) : void{
        assert(typeof(handler) == "function","handler must be a function");

        this.post_workflow.pushWork(handler,hash || RandomGen.GetRandomHash(10));
    }
    getLifeCyle(){
        return this.lifeCycle;
    }
    getResolver(){
        assert(this.lifeCycle.getState() == "ready", "jigsaw state must be ready");

        return this.resolver as IRegistryResolver;
    }
    async close(){
        await this.request_async_manager.waitAllDone();

        await this.resolver?.close();

        this.lifeCycle.setState("closed");
    }
        
    private async sendWithContext(path:Path,route:IRoute,router:IRouter,data:any = {}){
        assert(this.lifeCycle.getState() == "ready","jigsaw state must be ready");
        
        let path_str = path.stringify();
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
            result = await this.buildBufferAndSend(Path.fromString(pre_ctx.pathstr),pre_ctx.route,router,pre_ctx.data);
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
    async send(path_str:string,data:any = {}) : Promise<any>{
        const path = Path.fromString(path_str);

        const socket = await this.factory.getNewSocket();
        const client = await this.factory.getNewClient(socket);
        const router = await this.factory.getNewRouter(client);

        const route = new this.modules.DefaultRoute(path.regpath,this.resolver);

        try{
            let result = await this.sendWithContext(path,route,router,data);
            return result;
        }catch(err){
            throw err;
        }finally{
            await router.close();
            await client.close();
            await socket.close();
        }
    }
    async usend(url:string,method:string,data:any = {}){
        const url_obj = parseJigsawURL(url);
        const reg_server_info = new RegistryServerInfo(url_obj.protocol,url_obj.hostname,url_obj.port);

        const socket = await this.factory.getNewSocket();
        const client = await this.factory.getNewClient(socket);
        const router = await this.factory.getNewRouter(client);
        
        const resolver = await this.factory.getNewResolver(reg_server_info,router,this.domain_cache);

        const route = new this.modules.DefaultRoute(url_obj.jgname,resolver);
        try{
            const result = await this.sendWithContext(new Path(url_obj.jgname,method),route,router,data);
            return result;
        }catch(err){
            throw err
        }finally{
            await resolver.close();
            await router.close();
            await client.close();
            await socket.close();    
        }
        
    }
    async call(address:AddressInfo,path_str:string,data?: any) : Promise<any>{
        assert(this.lifeCycle.getState() == "ready", "jigsaw state must be ready");
        const path = Path.fromString(path_str);

        const socket = await this.factory.getNewSocket();
        const client = await this.factory.getNewClient(socket);
        const router = await this.factory.getNewRouter(client);
        
        const route = new NetRoute(address.port,address.address);

        try{
            await this.buildBufferAndSend(path,route,router,data);
        }catch(err){
            throw err;
        }finally{
            await router.close();
            await client.close();
            await socket.close();    
        }
        

    }
}