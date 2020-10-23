import AbstractSocket = require("./AbstractSocket");
import Dgram = require("dgram");
import assert = require("assert");
import AddressInfo = require("../domain/AddressInfo");

class UDPSocket extends AbstractSocket{

	private sock : Dgram.Socket;
	private state : string = "close";
	constructor(port : number,address:string){
		super(port,address);

		this.sock = Dgram.createSocket("udp4");
		
		this.sock.bind(port,address);
	
		
		this.sock.on("message",(data : Buffer,rinfo:Dgram.RemoteInfo)=>{ 
			
			this.emit("message",data,new AddressInfo(rinfo.address,rinfo.port));
	
		});
		this.sock.on("listening",()=>{ 
		//	this.sock.setRecvBufferSize(1024*1024*10);
		//	this.sock.setSendBufferSize(1024*1024*10);
		
			this.state = "ready";
			this.emit("ready"); 

		});
		this.sock.on("close",()=>{ 
			this.state = "close";
			this.emit("close"); 
		})
	}
	
	public getState() : string{
		return this.state;
	}
	public getAddress() : AddressInfo{

		let addr=this.sock.address();
		return new AddressInfo(addr.address,addr.port);

	}
	public send(data : Buffer, port : number, address : string = "") : void{
		assert(this.state == "ready","socket must be ready state");

		this.sock.send(data,port,address);
	}
	public close(){
		try{
			this.sock.close();
		}catch(err){
			
		}
	}
}


export = UDPSocket