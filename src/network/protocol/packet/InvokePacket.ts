import BasePacket = require("../BasePacket");

class InvokePacket extends BasePacket{
	public static packet_id : number = 3;
	getName(){
		return "InvokePacket";
	}
	constructor(){
		super();
		
	}
}

export = InvokePacket;

