import AbstractSocket from "../socket/AbstractSocket";
import IFactory from "../protocol/factory/IFactory";
import Packet from "../protocol/Packet";
import { TypedEmitter } from "tiny-typed-emitter";
import AbstractNetworkClient from "./AbstractNetworkClient";
import AddressInfo from "../domain/AddressInfo";

interface NetworkClientEvent{
	ready: () => void
	packet: (p:Packet)=> void;
	close: () => void;	
	error: (err : Error) => void;
}

class BaseNetworkClient extends AbstractNetworkClient{
	protected socket : AbstractSocket;
	protected state : string = "starting";
	protected factory : IFactory<Buffer,Packet>;
	protected clientid : string = "";
	private eventEmitter : TypedEmitter<NetworkClientEvent>;

	constructor(socket : AbstractSocket, factory : IFactory<Buffer,Packet>){
		super();

		this.factory = factory;
		this.socket = socket;

		this.socket.on("ready",this.onSocketReady.bind(this));
		this.socket.on("message",this.onSocketMessage.bind(this));
		this.socket.on("close",this.onSocketClose.bind(this));

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
		return this.socket.getState();
	}
	private initClientId() : void{
		this.clientid = "jg#" + Math.random() + "#";
	}
	public getClientId() : string{
		return this.clientid;
	}
	public getSocket() : AbstractSocket{
		return this.socket;
	}
	private onSocketReady(){
		if(this.state != "starting"){
			this.eventEmitter.emit("error",new Error("state transform error"))
			return;
		}

		this.state = "ready";
		this.eventEmitter.emit("ready");
	}
	private onSocketClose(){
		if(this.state == "close")
			return;

		this.state = "close";
		this.eventEmitter.emit("close");
	}
	private onSocketMessage(message : Buffer,rinfo:AddressInfo){
		let product = this.factory.getProduct(message);
		product.reply_info = rinfo;
		product.setBuffer(message);
		product.decode();
		this.handlePacket(product);
	}
	protected handlePacket(pk : Packet){
		this.eventEmitter.emit("packet",pk);
	}

	public sendPacket(packet : Packet,dst_port:number , dst_address:string){
		if(!packet.isBuilt())
			packet.encode();

		let buffer = packet.getSlicedData();
		this.socket.send(buffer, dst_port, dst_address);
	}
}

export default BaseNetworkClient;