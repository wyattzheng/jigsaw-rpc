import LifeCycle from "../../../utils/LifeCycle";
import { TypedEmitter } from "tiny-typed-emitter";
import AddressInfo from "../AddressInfo";

type RegNode = {jgname:string,jgid:string,address:AddressInfo,updateTime:number};
type QueryResult = Array<RegNode>;

export interface RegistryClientEvent{
    error(err: Error) : void;
}
export default interface IRegistryClient extends TypedEmitter<RegistryClientEvent>{
    getLifeCycle():LifeCycle;
    
    resolveAny(regpath : string,timeout? : number) : Promise<QueryResult>;
    resolve(regpath:string,timeout? : number) : Promise<RegNode>;    
    close() : void;
}
