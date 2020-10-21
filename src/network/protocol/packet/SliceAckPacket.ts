import BasePacket = require("../BasePacket");

class SliceAckPacket extends BasePacket{
	public static packet_id : number = 9;
    public partid : number = -1;
    
    constructor(){
        super();
    }
    getName(){
        return "SliceAckPacket";
    }
    encode(){
        super.encode.call(this);
        this.writeUInt16(this.partid);
    }
    decode(){
        super.decode.call(this);
        this.partid = this.readUInt16();
    }
}

export = SliceAckPacket;
