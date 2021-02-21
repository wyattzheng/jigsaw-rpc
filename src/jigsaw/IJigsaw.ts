import IRoute from "../network/router/route/IRoute";
import Path from "../network/request/Path";
import AddressInfo from "../network/domain/AddressInfo";
import ISocket from "../network/socket/ISocket";
import { TypedEmitter } from "tiny-typed-emitter";
import { JigsawOption } from "./JigsawOption";
import { UseContext } from "./context/Context";
import { PostWare, PreWare, UseWare } from "./JigsawWare"
import { IRegistryResolver } from "network/domain/client/IRegistryResolver";
import IRouter from "../network/router/IRouter";

interface JigsawEvent{
    error:(err : Error)=>void;
    ready:()=>void;
    closed:()=>void;
}

interface IJigsaw extends TypedEmitter<JigsawEvent>{
    getName() : string;
    getOption() : JigsawOption;
    getState() : "starting" | "ready" | "closed" | "closing" | "dead";
    
    send(path_str:string,data?:any) : Promise<any>;
    usend(url:string,method:string,data?:any):Promise<any>;

    call(path:Path,route:IRoute,data: any):Promise<any>;

    use(handler:UseWare,hash?:string) : void;
    pre(handler:PreWare,hash?:string) : void;
    post(handler:PostWare,hash?:string) : void;

    getAddress() : AddressInfo;
    
    getResolver(): IRegistryResolver;
    getRouter() : IRouter;
    getSocket() : ISocket;

    port(port_name:string,handler:(data:any,ctx:UseContext)=>any) : void;

    close() : Promise<void>;
}

export default IJigsaw;
