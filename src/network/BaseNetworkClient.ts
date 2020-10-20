import AbstractSocket = require("./socket/AbstractSocket");
import IBuilderManager = require("./protocol/builder/manager/IBuilderManager");
import IFactory = require("./protocol/factory/IFactory");
import StateManager = require("./StateManager");
import Packet = require("./protocol/Packet");
import Events = require("tiny-typed-emitter");
import AbstractNetworkClient = require("./AbstractNetworkClient");
import SlicePacket = require("./protocol/packet/SlicePacket");
import AddressInfo = require("./domain/AddressInfo");

class BaseNetworkClient extends AbstractNetworkClient{
	protected socket : AbstractSocket;
	protected state_manager : StateManager;
	protected builder_manager : IBuilderManager<SlicePacket,Packet>;
	protected factory : IFactory<Buffer,Packet>;
	protected clientid : string = "";
	constructor(socket : AbstractSocket, builder_manager : IBuilderManager<SlicePacket,Packet>, factory : IFactory<Buffer,Packet>){
		super();

		this.state_manager = new StateManager("close",["ready","close"]);
		this.builder_manager = builder_manager;
		this.factory = factory;
		this.socket = socket;

		this.state_manager.on("changed",this.onStateChanged.bind(this));
		this.socket.on("ready",this.onSocketReady.bind(this));
		this.socket.on("message",this.onSocketMessage.bind(this));
		this.socket.on("close",this.onSocketClose.bind(this));

		this.initClientId();
	}
	public getState(){
		return this.socket.getState();
	}
	public close(){
		if(this.socket.getState() == "close")
			return;
			
		this.socket.close();
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
	private onStateChanged(event : string){
		
		this.emit(event as 'ready' | 'close' );
	}
	private onSocketReady(){
		this.state_manager.setState("ready");
	}
	private onSocketClose(){
		this.state_manager.setState("close");
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
		packet.encode();

		let buffer = packet.getSlicedData();
		this.socket.send(buffer, dst_port, dst_address);
	}
}

export = BaseNetworkClient;