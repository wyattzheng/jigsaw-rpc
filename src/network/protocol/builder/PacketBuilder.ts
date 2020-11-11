import AbstractBuilder from "./AbstractBuilder";
import SlicePacket from "../packet/SlicePacket";
import IPacket from "../IPacket";
import IFactory from "../factory/IFactory";

class PacketBuilder extends AbstractBuilder<SlicePacket,IPacket>{

	private factory : IFactory<Buffer,IPacket>;
	constructor(partmax : number,factory : IFactory<Buffer,IPacket>){
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

export default PacketBuilder;
