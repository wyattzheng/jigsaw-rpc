import BasePacket = require("../BasePacket");
import Path = require("../../request/Path");

class InvokePacket extends BasePacket{
	public static packet_id : number = 3;
	
	public dst_path : Path = new Path("default","default");
	public src_jgname : string = "";
	public data : Buffer = Buffer.allocUnsafe(0);

	getName(){
		return "InvokePacket";
	}
	constructor(){
		super();
		
	}
	encode(){
		super.encode.call(this);
		this.writeString(this.request_id);
		this.writeString(this.dst_path.toString());
		this.writeString(this.src_jgname);
		this.writeBuffer(this.data);
	}
	decode(){
		super.decode.call(this);
		this.request_id = this.readString();
		this.dst_path = Path.fromString(this.readString());
		this.src_jgname = this.readString();
		this.data = this.readBuffer();
	}
}

export = InvokePacket;

