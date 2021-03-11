import AbstractSocket from "../socket/ISocket";
import IFactory from "../protocol/factory/IFactory";
import IPacket from "../protocol/IPacket";
import { TypedEmitter } from "tiny-typed-emitter";
import AddressInfo from "../../domain/AddressInfo";
import INetworkClient from "./INetworkClient";
import RandomGen from "../../utils/RandomGen";
import BatchPacket from "../../network/protocol/packet/BatchPacket";
import LifeCycle from "../../utils/LifeCycle";
import { LimitedQueue } from "../../utils/LimitedQueue";

interface NetworkClientEvent{
	packet: (p:IPacket) => void;
	error: (err:Error) => void;
}

interface BufferSendRequest{
	buffer:Buffer,
	dst_port:number,
	dst_address:string;
}
class BaseNetworkClient implements INetworkClient{
	static MAX_QUERY_TOPNEAR_COUNT = 2000;
	static MAX_PENDING_BUFFER_LEN = 1200;

	protected socket : AbstractSocket;
	protected factory : IFactory<Buffer,IPacket>;
	protected clientid : string = "";
	private eventEmitter : TypedEmitter<NetworkClientEvent>;
	private lifeCycle : LifeCycle = new LifeCycle();
	private queue = new LimitedQueue<BufferSendRequest>(2000);
	private timer? : number;

	constructor(socket : AbstractSocket, factory : IFactory<Buffer,IPacket>){

		this.factory = factory;
		this.socket = socket;
		
		this.eventEmitter = new TypedEmitter<NetworkClientEvent>();

		this.lifeCycle.setState("starting");

		this.initClientId();
		this.initSocket();
		this.initSendingLoop();
	}
	private initSendingLoop(){
		this.timer = setInterval(this.sendOnce.bind(this));
	}
	private sendOnce(){
		let batch = this.getNewBatchRequest();
		if(!batch)return;

		this.socket.send(batch.buffer,batch.dst_port,batch.dst_address)
	}
	private initSocket(){
		this.socket.getLifeCycle().when("ready").then(()=>{
			this.lifeCycle.setState("ready");
		})
		this.socket.getEventEmitter().on("message",this.onSocketMessage.bind(this));

	}
	private getNewBatchRequest() : BufferSendRequest | undefined{
		let first = this.queue.get(0);
		if(!first)return;

		let packet = new BatchPacket();
		packet.bufs = [];

		let sum_len = 0;
		let dst_address = first.dst_address;
		let dst_port = first.dst_port;

		for(let i=0;i<BaseNetworkClient.MAX_QUERY_TOPNEAR_COUNT;i++){
			let request = this.queue.get(0);
			if(!request)
				break;
			if(!(request.dst_address == dst_address && request.dst_port == dst_port))
				continue;
			
			packet.bufs.push(request.buffer);

			sum_len+=request.buffer.length;

			this.queue.shift();
			if(sum_len > BaseNetworkClient.MAX_PENDING_BUFFER_LEN)
				break;
		}

		if(packet.bufs.length<=0)
			return;

		packet.encode();
		let buffer = packet.getSlicedData();

		return {buffer,dst_address,dst_port};

	}
	public getEventEmitter(){
		return this.eventEmitter;
	}
	public getAddressInfo(){
		return this.socket.getAddress();
	}
	public getState(){
		return this.socket.getLifeCycle().getState();
	}
	private initClientId() : void{
		this.clientid = "jg#" + RandomGen.GetRandomHash(6) + "#";
	}
	public getClientId() : string{
		return this.clientid;
	}
	public getSocket() : AbstractSocket{
		return this.socket;
	}
	public getLifeCycle(){
		return this.lifeCycle;
	}
	private onSocketMessage(message : Buffer,rinfo:AddressInfo){

		let packet = this.parseMessage(message,rinfo);
		if(!packet)return;
		
		//console.log(packet.getName())
		if(packet.getName() == "BatchPacket")
			this.handleBatchPacket(packet as BatchPacket,rinfo);
		else
			this.handlePacket(packet);
	
	}
	private handleBatchPacket(packet:BatchPacket,rinfo:AddressInfo){
		for(let msg of packet.bufs){
			let pk = this.parseMessage(msg,rinfo);

			if(pk)
				this.handlePacket(pk);
		}
	}
	private parseMessage(message:Buffer,rinfo:AddressInfo){
		let product;
		try{
			product = this.factory.getProduct(message);
			product.setReplyInfo(rinfo);
			product.setBuffer(message);	
			product.decode();			
		}catch(err){
			this.eventEmitter.emit("error",err);
		}
		return product;
	}
	protected handlePacket(pk : IPacket){
		this.eventEmitter.emit("packet",pk);
	}

	public sendPacket(packet : IPacket,dst_port:number , dst_address:string){
		if(!packet.isBuilt())
			packet.encode();
	
		let buffer = packet.getSlicedData();
	//	this.socket.send(buffer, dst_port, dst_address);
		this.queue.push({buffer,dst_port,dst_address});
		
	}
	public async close(){
		clearInterval(this.timer);
	}
}

export default BaseNetworkClient;