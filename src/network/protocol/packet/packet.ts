class Packet{ // Design Mode : Builder Mode

	private static buffer_size : number = 1400;
	protected buffer : Buffer = Buffer.alloc( Packet.buffer_size );
	protected offset : number = 0;

	constructor(){

	}

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
