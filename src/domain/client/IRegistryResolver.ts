import AddressInfo from "../AddressInfo";
import LifeCycle from "../../utils/LifeCycle";

export type RegNode = {jgname:string,jgid:string,address:AddressInfo,updateTime:number};
export type QueryResult = Array<RegNode>;

export interface IRegistryResolver{
    getLifeCycle():LifeCycle;

    resolve(regpath:string,timeout?:number)  : Promise<RegNode>;
    resolveAny(regpath:string,timeout?:number) : Promise<QueryResult>;
    close() : Promise<void>;
}