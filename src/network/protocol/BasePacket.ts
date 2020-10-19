import Packet = require("./Packet");

class BasePacket extends Packet{ // Design Mode : Builder Mode
	private packetid : number = 0;
	getName(){
		return "BasePacket";
	}
	constructor(){
		super();

	}

	public getPacketId() : number{
		if(this.packetid > 0)
			return this.packetid;
		else
			return (this.constructor as any).packet_id;
	}
	public encode() : void{
		super.encode.call(this);
		
		this.writeUInt16(this.getPacketId());
		this.writeString(this.request_id);
		
	}
	public decode() : void{
		super.decode.call(this);

		let packet_id : number = this.readUInt16();
		
		this.packetid = packet_id;
		this.request_id=this.readString();
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
		this.writeBuffer(Buffer.from(str));
	};
	protected readString() : string{
		return this.readBuffer().toString();
	};

	protected writeBuffer(buf : Buffer) : void{
		
		this.buffer.writeUInt16BE(buf.length,this.offset);
		this.offset+=2;

		buf.copy(this.buffer,this.offset);
		this.offset+=buf.length;
	}
	protected readBuffer() : Buffer{

		let len=this.buffer.readUInt16BE(this.offset);
		this.offset+=2;

		let buf=this.buffer.slice(this.offset,this.offset+len);
		this.offset+=buf.length;

		return buf;
	};	
}

export = BasePacket;
