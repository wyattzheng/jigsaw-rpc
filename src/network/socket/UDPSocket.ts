import AbstractSocket = require("./AbstractSocket");
import Dgram = require("dgram");
import assert = require("assert");

class UDPSocket extends AbstractSocket{

	private sock : Dgram.Socket;
	private state : string = "close";
	constructor(port : number){
		super(port);

		this.sock = Dgram.createSocket("udp4");
		this.sock.bind(port);
		this.sock.on("message",(data : Buffer)=>{ this.emit("message",data) });
		this.sock.on("listening",()=>{ 
			this.state = "ready";
			this.emit("ready"); 
		});
		this.sock.on("close",()=>{ 
			this.state = "close";
			this.emit("close"); 
		})
	}
	send(data : Buffer, port : number, address : string = "") : void{
		assert(this.state == "ready","socket must be ready state");

		this.sock.send(data,port,address);
	}
}


export = UDPSocket