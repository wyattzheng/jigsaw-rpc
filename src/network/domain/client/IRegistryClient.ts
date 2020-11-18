import LifeCycle from "src/utils/LifeCycle";
import { TypedEmitter } from "tiny-typed-emitter";
import AddressInfo from "../AddressInfo";

type RegNode = {jgname:string,jgid:string,address:AddressInfo,updateTime:number};
type QueryResult = Array<RegNode>;

interface IRegistryClient{
    getLifeCycle():LifeCycle;
    
    resolveAny(regpath : string,timeout? : number) : Promise<QueryResult>;
    resolve(regpath:string,timeout? : number) : Promise<RegNode>;    
    close() : void;
}

export default IRegistryClient;
