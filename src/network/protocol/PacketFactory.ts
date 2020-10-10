import Packet = require("./packet/Packet");

class PacketFactory{
	protected packets : Packet[] = new Map<number,Packet>();

	constructor(){

	}
	registerPacket(PacketCls : Packet){
		this.packets[Packet.packet_id] = PacketCls;
	}
}

export = PacketFactory;
