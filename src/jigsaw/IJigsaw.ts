import IRoute from "../network/router/route/IRoute";
import Path from "../network/request/Path";
import IRegistryClient from "../network/domain/client/IRegistryClient";
import AddressInfo from "../network/domain/AddressInfo";
import ISocket from "../network/socket/ISocket";
import { TypedEmitter } from "tiny-typed-emitter";
import { JigsawOption } from "./JigsawOption";
import { PostContext, PreContext, UseContext } from "./context/Context";

type NextFunction = ()=>Promise<void>;

interface JigsawEvent{
    error:(err : Error)=>void;
    ready:()=>void;
    closed:()=>void;
}

interface IJigsaw extends TypedEmitter<JigsawEvent>{
    getName() : string;
    getOption() : JigsawOption;
    
    send(path_str:string,data?:any) : Promise<any>;
    call(path:Path,route:IRoute,data: any):Promise<any>;

    use(handler:(ctx:UseContext,next:NextFunction)=>Promise<void>) : void;
    pre(handler:(ctx:PreContext,next:NextFunction)=>Promise<void>) : void;
    post(handler:(ctx:PostContext,next:NextFunction)=>Promise<void>) : void;

    getAddress() : AddressInfo;
    
    getRegistryClient() : IRegistryClient;
    getSocket() : ISocket;
    setSocket(socket : ISocket) : void;

    port(port_name:string,handler:(data:any,ctx:UseContext)=>any) : void;

    close() : Promise<void>;
}

export default IJigsaw;
