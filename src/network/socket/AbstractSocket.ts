import events = require("tiny-typed-emitter");

interface SocketEvent{
	ready: () => void;
	close: () => void;
	message: (body:Buffer) => void;
} ;

abstract class AbstractSocket extends events.TypedEmitter<SocketEvent>{
	constructor(port : number){
		super();

	}
	public abstract send(data : Buffer, port : number, address : string) : void;

};


export = AbstractSocket;