import { TypedEmitter } from "tiny-typed-emitter";
import AddressInfo from "../AddressInfo";

interface DomainClientEvent{
	ready: () => void;
	close: () => void;	
}

interface IDomainClient{
    getEventEmitter() : TypedEmitter<DomainClientEvent> ;
    getState():string;
    resolve(jgname:string) : Promise<AddressInfo>;    
    updateAddress(jgname:string,addr:AddressInfo) : void;
    close() : void;
}

export default IDomainClient;
