import AbstractSocket = require("./socket/AbstractSocket");
import IBuilderManager = require("./protocol/builder/manager/IBuilderManager");
import IFactory = require("./protocol/factory/IFactory");
import StateManager = require("./state/StateManager");
import Packet = require("./protocol/Packet");
import Events = require("tiny-typed-emitter");
import AbstractNetworkClient = require("./AbstractNetworkClient");
import SlicePacket = require("./protocol/packet/SlicePacket");

class SimpleNetworkClient extends AbstractNetworkClient{
	protected socket : AbstractSocket;
	protected state_manager : StateManager;
	protected builder_manager : IBuilderManager<SlicePacket,Packet>;
	protected factory : IFactory<Buffer,Packet>;

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
	private onSocketMessage(message : Buffer){
		let product = this.factory.getProduct(message);
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

export = SimpleNetworkClient;