import IRoute from "../network/router/route/IRoute";
import Path from "../network/request/Path";
import IRegistryClient from "../network/domain/client/IRegistryClient";
import AddressInfo from "../network/domain/AddressInfo";
import ISocket from "../network/socket/ISocket";
import { TypedEmitter } from "tiny-typed-emitter";
import { JigsawOption } from "./JigsawOption";
import { UseContext } from "./context/Context";
import { PostWare, PreWare, UseWare } from "./JigsawWare"

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

    use(handler:UseWare,hash?:string) : void;
    pre(handler:PreWare,hash?:string) : void;
    post(handler:PostWare,hash?:string) : void;

    getAddress() : AddressInfo;
    
    getRegistryClient() : IRegistryClient;
    getSocket() : ISocket;
    setSocket(socket : ISocket) : void;

    port(port_name:string,handler:(data:any,ctx:UseContext)=>any) : void;

    close() : Promise<void>;
}

export default IJigsaw;
