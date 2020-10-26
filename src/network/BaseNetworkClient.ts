import AbstractSocket = require("./socket/AbstractSocket");
import IBuilderManager = require("./protocol/builder/manager/IBuilderManager");
import IFactory = require("./protocol/factory/IFactory");
import Packet = require("./protocol/Packet");
import Events = require("tiny-typed-emitter");
import AbstractNetworkClient = require("./AbstractNetworkClient");
import SlicePacket = require("./protocol/packet/SlicePacket");
import AddressInfo = require("./domain/AddressInfo");

class BaseNetworkClient extends AbstractNetworkClient{
	protected socket : AbstractSocket;
	protected state : string = "starting";
	protected factory : IFactory<Buffer,Packet>;
	protected clientid : string = "";

	constructor(socket : AbstractSocket, factory : IFactory<Buffer,Packet>){
		super();

		this.factory = factory;
		this.socket = socket;

		this.socket.on("ready",this.onSocketReady.bind(this));
		this.socket.on("message",this.onSocketMessage.bind(this));
		this.socket.on("close",this.onSocketClose.bind(this));

		this.initClientId();
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
			this.emit("error",new Error("state transform error"))
			return;
		}

		this.state = "ready";
		this.emit("ready");
	}
	private onSocketClose(){
		if(this.state == "close")
			return;

		this.state = "close";
		this.emit("close");
	}
	private onSocketMessage(message : Buffer,rinfo:AddressInfo){
		let product = this.factory.getProduct(message);
		product.reply_info = rinfo;
		product.setBuffer(message);
		product.decode();
		this.handlePacket(product);
	}
	protected handlePacket(pk : Packet){
		this.emit("packet",pk);
	}

	public sendPacket(packet : Packet,dst_port:number , dst_address:string){
		if(!packet.isBuilt())
			packet.encode();

		let buffer = packet.getSlicedData();
		this.socket.send(buffer, dst_port, dst_address);
	}
}

export = BaseNetworkClient;