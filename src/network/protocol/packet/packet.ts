import Direction = require("../Direction");

class Packet{ // Design Mode : Builder Mode

	private static buffer_size : number = 1400;

	protected buffer : Buffer = Buffer.alloc( Packet.buffer_size );
	public packet_type : string = "Packet";
	public direction : Direction = Direction.NONE;
	private offset : number = 0;

	constructor(){

	}

	public writeString(str : string) : void{
		let strbuf : Buffer = Buffer.from(str);
		
		this.buffer.writeUInt16BE(str.length);
		this.offset+=2;

		strbuf.copy(this.buffer,this.offset);
		this.offset+=strbuf.length;
	};
	public readString() : string{

		let strlen=this.buffer.readUInt16BE(this.offset);
		this.offset+=2;

		let strbuf=this.buffer.slice(this.offset,this.offset+strlen);
		this.offset+=strbuf.length;

		return strbuf.toString();
	};

	protected getSlicedData() : Buffer{
		return this.buffer.slice(0,this.offset);
	}

	public encode() : Buffer{
		this.offset = 0;

		return this.buffer;
	}
	public decode(buf : Buffer) : void{
		this.offset = 0;

		this.buffer = buf;
	}


}

export = Packet;
