import IRoute from "../network/router/route/IRoute";
import Path from "../network/request/Path";
import IRegistryClient from "../network/domain/client/IRegistryClient";
import AddressInfo from "../network/domain/AddressInfo";
import ISocket from "../network/socket/ISocket";
import { TypedEmitter } from "tiny-typed-emitter";

type NextFunction = ()=>Promise<void>;
type WorkFunction = (ctx:any,next:NextFunction)=>Promise<void>;

type InvokeResult = Object | Buffer | number | string | void;

interface JigsawEvent{
    error:(err : Error)=>void;
    ready:()=>void;
    closed:()=>void;
}

interface IJigsaw extends TypedEmitter<JigsawEvent>{
    getName() : string;
    getOption() : any;
    
    send(path_str:string,data?:Object | Buffer) : Promise<Object | Buffer>;
    call(path:Path,route:IRoute,data: Object | Buffer):Promise<Object | Buffer>;

    use(handler:WorkFunction) : void;
    pre(handler:WorkFunction) : void;

    getAddress() : AddressInfo;
    
    getRegistryClient() : IRegistryClient;
    getSocket() : ISocket;
    setSocket(socket : ISocket) : void;

    port(port_name:string,handler:(data:Object | Buffer,ctx:any)=>Promise<InvokeResult> | InvokeResult) : void;

    close() : Promise<void>;
}

export default IJigsaw;
