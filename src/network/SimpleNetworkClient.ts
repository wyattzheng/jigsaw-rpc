import AbstractSocket = require("./socket/AbstractSocket");
import IBuilderManager = require("./protocol/builder/manager/IBuilderManager");
import IFactory = require("./protocol/factory/IFactory");
import StateManager = require("./state/StateManager");
import Packet = require("./Packet");
import Events = require("tiny-typed-emitter");
import AbstractNetworkClient = require("./AbstractNetworkClient");

interface ClientEvent{
	ready: () => void
	packet: ()=> Packet;
	close: () => void;	
};

abstract class SimpleNetworkClient extends AbstractNetworkClient extends Events.TypedEmitter<ClientEvent>{
	protected socket : AbstractSocket;
	protected state_manager : StateManager;
	protected builder_manager : BuilderManager;

	constructor(socket : AbstractSocket, builder_manager : IBuilderManager, factory : IFactory<Buffer,Packet>){

		this.state_manager = new StateManager("ready",["ready","close"]);
		this.builder_manager = builder_manager;
		this.factory = factory;
		this.socket = socket;

		this.state_manager.on("changed",this.onStateChanged.bind(this));
		this.socket.on("ready",this.onSocketReady.bind(this));
		this.socket.on("message",this.onSocketMessage.bind(this));
		this.socket.on("close",this.onSocketClose.bind(this));
	}

	private onStateChanged(event : string){
		this.emit(event);
	}
	private onSocketReady(){
		this.state_manager.setState("ready");
	}
	private onSocketClose(){
		this.state_manager.setState("close");
	}
	private onSocketMessage(message : Buffer){
		let product = this.factory.getProduct(message);
		product.decode();
		this.emit("packet",product);
	}

	public sendPacket(packet : Packet,dst_port:number , dst_address:string){
		packet.encode();
		let buffer = packet.getSlicedData();
		this.socket.send(buffer, dst_port, dst_address);
	}
}

export = SimpleNetworkClient;