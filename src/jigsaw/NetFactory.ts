import IRouter from "../network/router/IRouter";
import ISocket from "../network/socket/ISocket";
import INetworkClient from "../network/client/INetworkClient";
import RegistryServerInfo from "../network/domain/RegistryServerInfo";
import DomainCacheStorage from "../network/domain/client/QueryCacheStorage";
import PacketFactory from "../network/protocol/factory/PacketFactory";
import { JigsawModuleOption } from "./JigsawOption";

export interface NetComponent{
    client:INetworkClient,
    socket:ISocket,
    router:IRouter
};

export class NetFactory{
    private modules:JigsawModuleOption;
    private err_handler:(err:Error)=>void;
    constructor(modules:JigsawModuleOption,err_handler:(err:Error)=>void){
        this.modules = modules;
        this.err_handler = err_handler;
    }
    async getNewResolver(registry:RegistryServerInfo,router:IRouter,cache:DomainCacheStorage){
        let resolver = new this.modules.RegistryResolver(registry,router,cache);
        await resolver.getLifeCycle().when("ready");
        return resolver;
    }
    async getNewClient(socket:ISocket){
        let factory = new PacketFactory();
        let builder_manager = new this.modules.BuilderManager(factory);
        let client=new this.modules.NetworkClient(socket,factory,builder_manager);
        client.getEventEmitter().on("error",this.err_handler);
        await client.getLifeCycle().when("ready");
        return client;
    }
    async getNewRouter(client:INetworkClient){
        let router = new this.modules.PacketRouter(client);
        await router.getLifeCycle().when("ready");
        return router;
    }
    async getNewSocket(listen_port?:number){
        let socket = new this.modules.Socket(listen_port,"0.0.0.0");
        socket.start();
        socket.getEventEmitter().on("error",this.err_handler);
        socket.setEmitting(true);
        await socket.getLifeCycle().when("ready");
        return socket;
    }
}
