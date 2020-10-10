import BasePacket = require("../BasePacket");

class SlicePacket extends BasePacket{
	public payload : Buffer = Buffer.alloc(0);
	public partid : number = -1;
	constructor(){
		super();

	}
	encode(){
		super.encode.call(this);
		this.writeUInt16(this.partid);
		this.writeBuffer(this.payload);
	}
	decode(){
		super.decode.call(this);
		this.partid = this.readUInt16();
		this.payload = this.readBuffer();
	}
}

export = SlicePacket;

