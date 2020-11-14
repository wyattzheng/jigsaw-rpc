import BasePacket from "../BasePacket";
import Path from "../../request/Path";

class InvokePacket extends BasePacket{
	public static packet_id : number = 3;
	
	public dst_path : Path = new Path("default","default");
	public src_jgname : string = "";
	public isJSON : boolean = true;
	public data : Buffer = Buffer.allocUnsafe(0);

	getName(){
		return "InvokePacket";
	}
	release(){
		super.release.call(this);
		
		this.data = Buffer.allocUnsafe(0);
	}
	constructor(){
		super();
		this.buffer = Buffer.allocUnsafe(1400);
		
	}
	encode(){
		super.encode.call(this);

		this.enlarge(this.data.length+1400);

		this.writeString(this.request_id);
		this.writeString(this.dst_path.stringify());
		this.writeString(this.src_jgname);
		this.writeUInt16(this.isJSON ? 1 : 0);
		
		this.writeLargeBuffer(this.data);

	}
	decode(){

		super.decode.call(this);
		this.request_id = this.readString();
		this.dst_path = Path.fromString(this.readString());
		this.src_jgname = this.readString();
		this.isJSON = this.readUInt16() == 1;
		

		this.data = this.readLargeBuffer();
		
	}
}

export default InvokePacket;

