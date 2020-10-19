import events = require("tiny-typed-emitter");
import AddressInfo = require("../domain/AddressInfo");

interface SocketEvent{
	ready: () => void;
	close: () => void;
	message: (body:Buffer,rinfo:AddressInfo) => void;
} ;

abstract class AbstractSocket extends events.TypedEmitter<SocketEvent>{
	constructor(port : number,address:string){
		super();

	}
	public abstract send(data : Buffer, port : number, address : string) : void;

};


export = AbstractSocket;