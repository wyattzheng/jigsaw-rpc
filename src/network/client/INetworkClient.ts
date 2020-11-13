
import LifeCycle from "../../utils/LifeCycle";
import { TypedEmitter } from "tiny-typed-emitter";
import AddressInfo from "../domain/AddressInfo";
import IPacket from "../protocol/IPacket"
import ISocket from "../socket/ISocket";

interface NetworkClientEvent{
	packet: (p:IPacket) => void;
	error: (err:Error) => void;
}

interface INetworkClient {
	getEventEmitter() : TypedEmitter<NetworkClientEvent>;
	getLifeCycle() : LifeCycle;

	getClientId() : string;
	getAddressInfo() : AddressInfo;
	sendPacket(packet : IPacket,dst_port:number,dst_address:string) : void;
	getSocket() :ISocket;
}

export default INetworkClient;
