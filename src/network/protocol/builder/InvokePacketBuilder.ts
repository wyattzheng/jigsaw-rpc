import AbstractBuilder = require("./AbstractBuilder");
import SlicePacket = require("../packet/SlicePacket");
import InvokePacket = require("../packet/InvokePacket");

class InvokePacketBuilder extends AbstractBuilder<SlicePacket,InvokePacket>{
	constructor(partmax : number){
		super(partmax);

	}
	whichPart(packet : SlicePacket){
		return packet.partid;
	}
	build(parts : Array<SlicePacket>){
		let bufs = new Array<Buffer>();
		for(let part of parts){
			bufs.push(part.payload);
		}
		let fullbuf=Buffer.concat(bufs)

		let pk = new InvokePacket();

		pk.setBuffer(fullbuf);
		return pk;
	}
}

export = InvokePacketBuilder;
