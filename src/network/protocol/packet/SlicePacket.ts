import BasePacket = require("../BasePacket");

class SlicePacket extends BasePacket{
	public static packet_id : number = 2;
	public buildkey : string = "";
	public payload : Buffer = Buffer.allocUnsafe(0);
	public partid : number = 0;
	public partmax : number = 1;
	constructor(){
		super();
		this.buffer = Buffer.allocUnsafe(1400);
	}
	release(){
		super.release.call(this);
		
		this.payload = Buffer.allocUnsafe(0);
	}
	getName(){
		return "SlicePacket";
	}	
	encode(){			
		super.encode.call(this);
		this.enlarge(this.payload.length+1400);

		this.writeString(this.buildkey);
		this.writeUInt16(this.partid);
		this.writeUInt16(this.partmax);
		this.writeLargeBuffer(this.payload);
	}
	decode(){
		super.decode.call(this);

		this.buildkey = this.readString();
		this.partid = this.readUInt16();
		this.partmax = this.readUInt16();
		this.payload = this.readLargeBuffer();
	}
}

export = SlicePacket;

