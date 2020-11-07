import { TypedEmitter } from "tiny-typed-emitter";
import LifeCycle from "../../utils/LifeCycle";
import AddressInfo from "../domain/AddressInfo";

interface SocketEvent{
	message: (body:Buffer,rinfo:AddressInfo) => void;
} ;

interface ISocket{	
	getEventEmitter() :TypedEmitter<SocketEvent>;
	getLifeCycle() : LifeCycle;
	close() : void;
	send(data : Buffer, port : number, address : string) : void;
	getAddress() : AddressInfo;
};

export default ISocket;