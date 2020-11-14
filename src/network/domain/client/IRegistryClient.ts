import LifeCycle from "src/utils/LifeCycle";
import { TypedEmitter } from "tiny-typed-emitter";
import AddressInfo from "../AddressInfo";

type QuerySingleResult = {jgname:string,jgid:string,addr:AddressInfo};

interface IRegistryClient{
    getLifeCycle():LifeCycle;
    
    resolveAny(regpath : string,timeout? : number) : Promise<Array<QuerySingleResult>>;
    resolve(regpath:string,timeout? : number) : Promise<QuerySingleResult>;    
    close() : void;
}

export default IRegistryClient;
