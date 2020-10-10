import BasePacket = require("../BasePacket");

class TestPacket extends BasePacket{
	public static packet_id : number = 1;
	public testdata : string = "";

	constructor(){
		super();

	}
	public encode() : void{
		super.encode.call(this);
		
		this.writeString(this.testdata);

	}
	public decode(buf : Buffer) : void{
		super.decode.call(this,buf);

		this.testdata = this.readString();
	}
}

export = TestPacket;