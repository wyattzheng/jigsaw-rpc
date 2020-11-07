import Packet from "./Packet";

class BasePacket extends Packet{ // Design Mode : Builder Mode
	private packetid : number = 0;
	getName(){
		return "BasePacket";
	}
	constructor(){
		super();

	}
	release(){
		this.buffer = Buffer.allocUnsafe(0);
		
	}
	enlarge(size:number){
		let newbuffer = Buffer.allocUnsafe(size);
		//console.log(this.offset);
		this.buffer.slice(0,this.offset)
		.copy(newbuffer,0);

		this.buffer = newbuffer;

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
	protected writeUInt32(digit : number) : void{

		this.buffer.writeUInt32BE(digit,this.offset);
		this.offset+=2;

	}
	
	protected readUInt32() : number{

		let ret : number = this.buffer.readUInt32BE(this.offset);
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
	protected writeLargeBuffer(buf : Buffer) : void{
		this.buffer.writeUInt32BE(buf.length,this.offset);
		this.offset+=4;

		buf.copy(this.buffer,this.offset);
		this.offset+=buf.length;

	}
	protected readLargeBuffer() : Buffer{

		let len=this.buffer.readUInt32BE(this.offset);
		this.offset+=4;

		let buf=this.buffer.slice(this.offset,this.offset+len);
		this.offset+=buf.length;

		return buf;
	};	
		
}

export default BasePacket;
