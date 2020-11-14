import LifeCycle from "src/utils/LifeCycle";
import { TypedEmitter } from "tiny-typed-emitter";
import AddressInfo from "../AddressInfo";

interface IRegistryClient{
    getLifeCycle():LifeCycle;
    resolve(jgname:string) : Promise<AddressInfo>;    
    close() : void;
}

export default IRegistryClient;
