import AbstractBuilderManager=require("./AbstractBuilderManager");
import Packet = require("../../Packet");
import IBuilder = require("../IBuilder");
import PacketBuilder = require("../PacketBuilder");
import SlicePacket = require("../../packet/SlicePacket");
import IFactory = require("../../factory/IFactory");

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

export = PacketBuilderManager;