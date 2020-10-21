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
		this.buffer = Buffer.allocUnsafe(0);
		
	}
	encode(){
		if(!this.built)
			this.buffer = Buffer.allocUnsafe(this.data.length+1400);
		else
			return;

		super.encode.call(this);

		this.writeString(this.request_id);
		this.writeString(this.dst_path.toString());
		this.writeString(this.src_jgname);
		
		this.writeLargeBuffer(this.data);

	}
	decode(){
		if(this.built)
			return;

		super.decode.call(this);
		this.request_id = this.readString();
		this.dst_path = Path.fromString(this.readString());
		this.src_jgname = this.readString();
		
		/*let buflen = this.readUInt32();
		this.offset -=4;
		if(buflen > 1024){
			let newbuf = Buffer.allocUnsafe(buflen+500);
			this.buffer.copy(newbuf,0);
			console.log(newbuf,this.buffer,buflen,this.offset)
			this.buffer = newbuf;	
		}*/

		this.data = this.readLargeBuffer();
		
	}
}

export = InvokePacket;

