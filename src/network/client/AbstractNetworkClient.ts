
import { TypedEmitter } from "tiny-typed-emitter";
import AddressInfo from "../domain/AddressInfo";
import Packet from "../protocol/Packet"
import AbstractSocket from "../socket/AbstractSocket";

interface NetworkClientEvent{
	ready: () => void
	packet: (p:Packet)=> void;
	close: () => void;	
	error: (err : Error) => void;
}

abstract class AbstractNetworkClient {
	public abstract getEventEmitter() : TypedEmitter<NetworkClientEvent>;
	public abstract getState() : string;
	public abstract getClientId() : string;
	public abstract getAddressInfo() : AddressInfo;

	public abstract sendPacket(packet : Packet,dst_port:number,dst_address:string) : void;
	public abstract getSocket() :AbstractSocket;
}

export default AbstractNetworkClient;
