import { TypedEmitter } from "tiny-typed-emitter";
import AddressInfo from "../AddressInfo";

interface StorageEvent{
    DomainPurgeEvent:(jgid:string)=>void;
}

type QueryResult = Array<{jgid:string,addr:AddressInfo}>;

interface IRegistryStorage{

    getEventEmitter() : TypedEmitter<StorageEvent>
    setNode(jgid:string,jgname:string,addrinfo:AddressInfo) : void;
    removeNode(jgid:string,jgname:string):void;
    queryNode(statement:string):QueryResult;
    clearExpiredNodes() : void;

}


export default IRegistryStorage;
