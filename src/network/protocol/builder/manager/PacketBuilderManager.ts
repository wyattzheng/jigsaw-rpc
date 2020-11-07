import AbstractBuilderManager from "./AbstractBuilderManager";
import Packet from "../../Packet";
import IBuilder from "../IBuilder";
import PacketBuilder from "../PacketBuilder";
import SlicePacket from "../../packet/SlicePacket";
import IFactory from "../../factory/IFactory";

class PacketBuilderManager extends AbstractBuilderManager<SlicePacket,Packet>{
	protected factory : IFactory<Buffer,Packet>;
	constructor(factory : IFactory<Buffer,Packet>){
		super();
		this.factory = factory;
	}
	getNewBuilder(maxslices : number) : IBuilder<SlicePacket,Packet>{
		return new PacketBuilder(maxslices,this.factory);
	}

}

export default PacketBuilderManager;