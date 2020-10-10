import Packet = require("./Packet");
import Direction = require("../Direction");

class BasePacket extends Packet{ // Design Mode : Builder Mode

	public static packet_id : number = 0;


	public direction : Direction = Direction.NONE;

	constructor(){
		super();

	}
	getPacketId() : number{
		return (this.constructor as any).packet_id;
	}
	public encode() : Buffer{
		super.encode.call(this);
		
		this.writeUInt16(this.getPacketId());
		this.writeUInt16(this.direction);

		return this.getSlicedData();
		
	}
	public decode(buf : Buffer) : void{
		super.decode.call(this,buf);

		let packet_id : number = this.readUInt16();
		this.direction = this.readUInt16();

	}

	protected writeUInt16(digit : number) : void{

		this.buffer.writeUInt16BE(digit,this.offset);
		this.offset+=2;

	}
	
	protected readUInt16() : number{

		let ret : number = this.buffer.readUInt16BE(this.offset);
		this.offset+=2;

		return ret;
	}

	protected writeString(str : string) : void{
		let strbuf : Buffer = Buffer.from(str);
		
		this.buffer.writeUInt16BE(str.length,this.offset);
		this.offset+=2;

		strbuf.copy(this.buffer,this.offset);
		this.offset+=strbuf.length;
	};
	protected readString() : string{

		let strlen=this.buffer.readUInt16BE(this.offset);
		this.offset+=2;

		let strbuf=this.buffer.slice(this.offset,this.offset+strlen);
		this.offset+=strbuf.length;

		return strbuf.toString();
	};
}

export = BasePacket;
