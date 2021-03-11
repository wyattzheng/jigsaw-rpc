import { TypedEmitter } from "tiny-typed-emitter";
import AddressInfo from "../AddressInfo";

interface StorageEvent{
    DomainPurgeEvent:(jgid:string)=>void;
}

type RegNode = {jgid:string,jgname:string,address:AddressInfo,updateTime:number};
type QueryResult = Array<RegNode>;
type FlattedNodes = Array<{key:string,parent:string,name:string,type:number,nodedata:RegNode | undefined}>;

interface IRegistryStorage{

    getEventEmitter() : TypedEmitter<StorageEvent>
    setNode(jgid:string,jgname:string,addrinfo:AddressInfo) : void;
    removeNode(jgid:string,jgname:string):void;
    queryNode(statement:string):QueryResult;
    clearExpiredNodes() : void;
    getFlattedNodes() : FlattedNodes;

}


export default IRegistryStorage;
