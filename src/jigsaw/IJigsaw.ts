import IRoute from "../network/router/route/IRoute";
import Path from "../network/request/Path";
import IRegistryClient from "../network/domain/client/IRegistryClient";
import AddressInfo from "../network/domain/AddressInfo";

type NextFunction = ()=>Promise<void>;
type WorkFunction = (ctx:any,next:NextFunction)=>Promise<void>;

interface IJigsaw{
    getName() : string;
    getOption() : any;
    
    send(path_str:string,data:object | Buffer) : Promise<object | Buffer>;
    call(path:Path,route:IRoute,data: object | Buffer):Promise<object | Buffer>;

    use(handler:WorkFunction) : void;
    pre(handler:WorkFunction) : void;

    getAddress() : AddressInfo;
    getRegistryClient() : IRegistryClient;

    port(port_name:string,handler:(data:object | Buffer,ctx:any)=>Promise<object | Buffer> | object | Buffer) : void;

    close() : Promise<void>;
}

export default IJigsaw;
