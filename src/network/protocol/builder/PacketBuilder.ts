import AbstractBuilder = require("./AbstractBuilder");
import SlicePacket = require("../packet/SlicePacket");
import Packet = require("../Packet");
import IBuilder = require("./IBuilder");
import IFactory = require("../factory/IFactory");

class PacketBuilder extends AbstractBuilder<SlicePacket,Packet>{

	private factory : IFactory<Buffer,Packet>;
	constructor(partmax : number,factory : IFactory<Buffer,Packet>){
		super(partmax);
		this.factory = factory;
	}
	whichPart(packet : SlicePacket) : number{
		return packet.partid;
	}
	build(parts : Array<SlicePacket>){
		let bufs = new Array<Buffer>();
		for(let part of parts){
			bufs[part.partid] = part.payload;
		}
		let fullbuf=Buffer.concat(bufs)
		let product = this.factory.getProduct(fullbuf);
		product.setBuffer(fullbuf);
		return product;
	}
}

export = PacketBuilder;
