import AddressInfo from "../domain/AddressInfo";

abstract class Packet{ // Design Mode : Builder Mode
	public static packet_id : number = 0;
	public request_id : string = "";
	public reply_info : AddressInfo = new AddressInfo("Not a valid target",-1);

	private static buffer_size : number = 1024*1024;
	protected buffer : Buffer = Buffer.allocUnsafe( 1024*1024*10 );
	protected offset : number = 0;

	constructor(){

	}
	abstract getName() : string;

	getPacketId() : number{
		return (this.constructor as any).packet_id;
	}
	public getSlicedData(check : boolean = true) : Buffer{
//		if(this.offset > Packet.buffer_size && check)
//			throw new Error("this buffer is too large to get")
		this.buffer = this.buffer.slice(0,this.offset);
		return this.buffer;
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
