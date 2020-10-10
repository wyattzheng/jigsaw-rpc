import Packet = require("./Packet");

class TestPacket extends Packet{
	public packet_type : string = "TestPacket";
	public testdata : string = "";

	constructor(){
		super();

	}
	public encode() : Buffer{
		super.encode.call(this);
		
		this.writeString(this.testdata);

		return this.getSlicedData();
	}
	public decode(buf : Buffer) : void{
		super.decode.call(this,buf);

		this.testdata = this.readString();
	}
}

export = TestPacket;