
import Events = require("tiny-typed-emitter");
import Packet = require("./protocol/Packet")
import AbstractSocket = require("./socket/AbstractSocket");

interface NetworkClientEvent{
	ready: () => void
	packet: (p:Packet)=> void;
	close: () => void;	
}

abstract class AbstractNetworkClient extends Events.TypedEmitter<NetworkClientEvent>{

	public abstract getState() : string;
	public abstract getClientId() : string;
	public abstract sendPacket(packet : Packet,dst_port:number,dst_address:string) : void;
	public abstract getSocket() :AbstractSocket;
	public abstract close() : void;
}

export = AbstractNetworkClient;
