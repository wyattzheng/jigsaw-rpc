import LifeCycle from "src/utils/LifeCycle";
import { TypedEmitter } from "tiny-typed-emitter";
import AddressInfo from "../AddressInfo";

interface DomainClientEvent{
	ready: () => void;
	close: () => void;	
}

interface IDomainClient{
    getLifeCycle():LifeCycle;
    resolve(jgname:string) : Promise<AddressInfo>;    
    close() : void;
}

export default IDomainClient;
