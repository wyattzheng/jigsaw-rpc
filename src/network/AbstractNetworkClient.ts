
import Events = require("tiny-typed-emitter");
import AddressInfo = require("./domain/AddressInfo");
import Packet = require("./protocol/Packet")
import AbstractSocket = require("./socket/AbstractSocket");

interface NetworkClientEvent{
	ready: () => void
	packet: (p:Packet)=> void;
	close: () => void;	
	error: (err : Error) => void;
}

abstract class AbstractNetworkClient {
	public abstract getEventEmitter() : Events.TypedEmitter<NetworkClientEvent>;
	public abstract getState() : string;
	public abstract getClientId() : string;
	public abstract getAddressInfo() : AddressInfo;

	public abstract sendPacket(packet : Packet,dst_port:number,dst_address:string) : void;
	public abstract getSocket() :AbstractSocket;
}

export = AbstractNetworkClient;
