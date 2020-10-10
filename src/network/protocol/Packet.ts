class Packet{ // Design Mode : Builder Mode
	public static packet_id : number = 0;
	
	private static buffer_size : number = 1400;
	protected buffer : Buffer = Buffer.alloc( Packet.buffer_size );
	protected offset : number = 0;

	constructor(){

	}
	getPacketId() : number{
		return (this.constructor as any).packet_id;
	}
	public getSlicedData() : Buffer{
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
