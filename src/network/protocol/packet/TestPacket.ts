import BasePacket = require("../BasePacket");

class TestPacket extends BasePacket{
	public static packet_id : number = 1;
	public testdata : string = "";

	constructor(){
		super();

	}
	getName() : string{
		return "TestPacket";
	}
	public encode() : void{
		if(this.built)return;

		super.encode.call(this);
		this.writeString(this.testdata);

	}
	public decode() : void{
		if(this.built)return;
		
		super.decode.call(this);

		this.testdata = this.readString();
	}
}

export = TestPacket;