import Path from "../network/request/Path";

type HandlerRet = Promise<object> | Promise<void>  | object | void;
interface IJigsaw{
    jgname : string;

    send(path_str:string,data:object) : Promise<object>;
    port(port_name:string,handler:(data : object) => HandlerRet) : void;
    handle(handler:(port_name:string,data:object)=> HandlerRet) : void;
    close() : void;
}

export = IJigsaw;
