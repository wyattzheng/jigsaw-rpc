import { TypedEmitter } from "tiny-typed-emitter";
import ISocket from "../../../src/network/socket/ISocket";
import AddressInfo  from "../../../src/network/domain/AddressInfo";
import LifeCycle from "../../../src/utils/LifeCycle";
import Dgram from "dgram";
import assert from "assert";

interface SocketEvent{
	message: (body:Buffer,rinfo:AddressInfo) => void;
	error : (err : Error) => void;
} ;

class MockNotGoodSocket implements ISocket{

	private sock : Dgram.Socket;
	private lifeCycle : LifeCycle = new LifeCycle();
	private eventEmitter = new TypedEmitter<SocketEvent>();
	private port? : number;
	private address? : string;
	private emitting : boolean = false;

	constructor(port? : number,address?:string){
		this.port = port;
		this.address = address;

		this.sock = Dgram.createSocket("udp4");
	
		this.sock.on("message",(data : Buffer,rinfo:Dgram.RemoteInfo)=>{ 
			if(!this.emitting)
                return;
                
            if(Math.random()<0.8)
               this.eventEmitter.emit("message",data,new AddressInfo(rinfo.address,rinfo.port));
	
		});
		this.sock.on("listening",()=>{ 
			this.sock.setRecvBufferSize(1024*1024*10);
			this.sock.setSendBufferSize(1024*1024*10);
		
			this.lifeCycle.setState("ready");
		});
		this.sock.on("close",()=>{ 
			this.emitting = false;
			this.lifeCycle.setState("closed"); 
		});
		this.sock.on("error",(err:Error)=>{
			this.eventEmitter.emit("error",err);
		});
		
	}

	public async start(){
		this.sock.bind(this.port,this.address);
		this.lifeCycle.setState("starting");
	}
	public async setEmitting(emitting : boolean){
		this.emitting = emitting;
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


        if(Math.random()<0.8)
    		this.sock.send(data,port,address);

	}
	public async close() : Promise<void>{
		return new Promise((resolve)=>{
			this.sock.close(resolve);
		})
    }
    
    /*
        This mock socket simulated that a bad network condition,
        but message can transfer correctly sometimes
    */
}


export default MockNotGoodSocket;
