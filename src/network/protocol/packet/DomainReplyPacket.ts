import BasePacket = require("../BasePacket");

class DomainReplyPacket extends BasePacket{
	public static packet_id : number = 4;

    public jgname:string="";
    public address:string="";
    public port:number=-1;
    constructor(){
        super();
    }
    getName(){
        return "DomainReplyPacket";
    }
    encode(){
        super.encode.call(this);
        this.writeString(this.jgname);
        this.writeString(this.address);
        this.writeUInt16(this.port);
        
    }
    decode(){
        super.decode.call(this);
        this.jgname = this.readString();
        this.address = this.readString();
        this.port = this.readUInt16();
    }
}

export = DomainReplyPacket;
