import Events = require("tiny-typed-emitter");

interface NetworkClientEvent{
	packet: (Packet : packet) => void;
}

abstract class AbstractNetworkClient extends Events.TypedEmitter<NetworkClientEvent>{

	public sendPacket(packet : Packet,dst_port:number,dst_address:string);
}

export = AbstractNetworkClient;
