import { Address } from "cluster";
import { TypedEmitter } from "tiny-typed-emitter";
import AddressInfo from "../domain/AddressInfo";

interface SocketEvent{
	ready: () => void;
	close: () => void;
	message: (body:Buffer,rinfo:AddressInfo) => void;
} ;

abstract class AbstractSocket extends TypedEmitter<SocketEvent>{
	constructor(port? : number,address?:string){
		super();

	}
	public abstract getState() : string;
	public abstract close() : void;
	public abstract send(data : Buffer, port : number, address : string) : void;
	public abstract getAddress() : AddressInfo;
};


export default AbstractSocket;