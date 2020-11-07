import ISocket from "./ISocket";
import Dgram from "dgram";
import assert from "assert";
import AddressInfo from "../domain/AddressInfo";
import LifeCycle from "../../utils/LifeCycle";
import { TypedEmitter } from "tiny-typed-emitter";

interface SocketEvent{
	message: (body:Buffer,rinfo:AddressInfo) => void;
} ;

class UDPSocket implements ISocket{

	private sock : Dgram.Socket;
	private lifeCycle : LifeCycle = new LifeCycle();
	private eventEmitter = new TypedEmitter<SocketEvent>();

	constructor(port? : number,address?:string){

		this.sock = Dgram.createSocket("udp4");
		
		this.sock.bind(port,address);
	
		this.sock.on("message",(data : Buffer,rinfo:Dgram.RemoteInfo)=>{ 
			
			this.eventEmitter.emit("message",data,new AddressInfo(rinfo.address,rinfo.port));
	
		});
		this.sock.on("listening",()=>{ 
			this.sock.setRecvBufferSize(1024*1024*10);
			this.sock.setSendBufferSize(1024*1024*10);
		
			this.lifeCycle.setState("ready");
		});
		this.sock.on("close",()=>{ 
			this.lifeCycle.setState("closed"); 

		})
	}
	public getEventEmitter(){
		return this.eventEmitter;
	}
	public getLifeCycle(){
		return this.lifeCycle;
	}
	public getAddress() : AddressInfo{
		let addr=this.sock.address();
		return new AddressInfo(addr.address,addr.port);

	}
	public send(data : Buffer, port : number, address : string = "") : void{
		assert(this.getLifeCycle().getState() == "ready","socket must be ready state");

		this.sock.send(data,port,address);
	}
	public close(){
		return new Promise((resolve)=>{
			this.sock.close(resolve);
		})
	}
}


export default UDPSocket