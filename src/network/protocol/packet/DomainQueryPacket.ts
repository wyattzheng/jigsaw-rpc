import BasePacket = require("../BasePacket");
class DomainQueryPacket extends BasePacket{
	public static packet_id : number = 5;

    public jgname : string = "";
    constructor(){
        super();

    }
    encode(){
        super.encode.call(this);
        this.writeString(this.jgname);
        
    }
    decode(){
        super.decode.call(this);
        this.jgname = this.readString();

    }

}

export = DomainQueryPacket;
