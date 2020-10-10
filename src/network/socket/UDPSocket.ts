import AbstractSocket = require("./AbstractSocket");
import Dgram = require("dgram");

class UDPSocket extends AbstractSocket{

	private sock : Dgram.Socket;

	constructor(port : number){
		super(port);

		this.sock = Dgram.createSocket("udp4");
		this.sock.bind(80);

		this.sock.on("message",(data : Buffer)=>{ this.emit("message",data) });
		this.sock.on("listening",()=>{ this.emit("ready"); });
		this.sock.on("close",()=>{ this.emit("close"); })
	}
	send(data : Buffer, port : number, address : string = "") : void{
		this.sock.send(data,port,address);
	}
}


export = UDPSocket