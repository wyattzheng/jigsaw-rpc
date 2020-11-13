import { TypedEmitter } from "tiny-typed-emitter";
import LifeCycle from "../../utils/LifeCycle";
import AddressInfo from "../domain/AddressInfo";

interface SocketEvent{
	message: (body:Buffer,rinfo:AddressInfo) => void;
	error: (err:Error)=>void;
} ;

interface ISocket{	
	getEventEmitter() :TypedEmitter<SocketEvent>;
	getLifeCycle() : LifeCycle;
	start() : Promise<void>;
	close() : Promise<void>;
	send(data : Buffer, port : number, address : string) : void;
	getAddress() : AddressInfo;
};

export default ISocket;