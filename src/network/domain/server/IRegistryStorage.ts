import { TypedEmitter } from "tiny-typed-emitter";
import AddressInfo from "../AddressInfo";

interface StorageEvent{
    DomainPurgeEvent:(jgid:string)=>void;
}

type QueryResult = Array<{jgid:string,addr:AddressInfo}>;

interface IRegistryStorage{

    getEventEmitter() : TypedEmitter<StorageEvent>
    setAddress(jgid:string,jgname:string,addrinfo:AddressInfo) : void;
    queryAddress(jgname:string):QueryResult;
 
}


export default IRegistryStorage;
