import VariableOption from "./option/VariableOption";

type HandlerRet = Promise<object> | Promise<void>  | object | void;

interface IJigsaw{
    jgname : string;

    send(path_str:string,data:any,option?:VariableOption) : Promise<object>;
    port(port_name:string,handler:(data:any,reply_info:VariableOption) => HandlerRet) : void;
    unport(port_name:string) : void;

    handle(handler:(port_name:string,data:any,reply_info:VariableOption)=> HandlerRet) : void;
    close() : Promise<void>;
}

export default IJigsaw;
