import AddressInfo from "../domain/AddressInfo";

abstract class Packet{ // Design Mode : Builder Mode
	public static packet_id : number = 0;
	public request_id : string = "";
	public reply_info : AddressInfo = new AddressInfo("Not a valid target",-1);

	private static buffer_size : number = 1400;
	protected buffer : Buffer = Buffer.alloc( Packet.buffer_size );
	protected offset : number = 0;

	constructor(){

	}
	abstract getName() : string;

	getPacketId() : number{
		return (this.constructor as any).packet_id;
	}
	public getSlicedData() : Buffer{
		if(this.offset > Packet.buffer_size)
			throw new Error("this buffer is too large to get")
		return this.buffer.slice(0,this.offset);
	}
	public setBuffer(buf : Buffer){
		this.buffer = buf;
	}
	public encode() : void{
		this.offset = 0;

	}
	public decode() : void{
		this.offset = 0;
	}


}

export = Packet;
