import AbstractSocket from "../socket/ISocket";
import IFactory from "../protocol/factory/IFactory";
import IPacket from "../protocol/IPacket";
import { TypedEmitter } from "tiny-typed-emitter";
import AddressInfo from "../domain/AddressInfo";
import INetworkClient from "./INetworkClient";
import RandomGen from "../../utils/RandomGen";

interface NetworkClientEvent{
	packet: (p:IPacket)=> void;
}

class BaseNetworkClient implements INetworkClient{
	protected socket : AbstractSocket;
	protected factory : IFactory<Buffer,IPacket>;
	protected clientid : string = "";
	private eventEmitter : TypedEmitter<NetworkClientEvent>;

	constructor(socket : AbstractSocket, factory : IFactory<Buffer,IPacket>){

		this.factory = factory;
		this.socket = socket;

		this.socket.getEventEmitter().on("message",this.onSocketMessage.bind(this));

		this.eventEmitter = new TypedEmitter<NetworkClientEvent>();
		this.initClientId();
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
		return this.socket.getLifeCycle();
	}
	private onSocketMessage(message : Buffer,rinfo:AddressInfo){
		let product = this.factory.getProduct(message);
		product.setReplyInfo(rinfo);
		product.setBuffer(message);
		product.decode();
		this.handlePacket(product);
	}
	protected handlePacket(pk : IPacket){
		this.eventEmitter.emit("packet",pk);
	}

	public sendPacket(packet : IPacket,dst_port:number , dst_address:string){
		if(!packet.isBuilt())
			packet.encode();

		let buffer = packet.getSlicedData();
		this.socket.send(buffer, dst_port, dst_address);
	}
}

export default BaseNetworkClient;