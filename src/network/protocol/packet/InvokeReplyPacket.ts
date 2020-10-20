import BasePacket = require("../BasePacket");

class InvokeReplyPacket extends BasePacket{
	public static packet_id : number = 8;
    public jgname:string="";
    public path:string="";
    public data:Buffer=Buffer.alloc(0);
    
    constructor(){
        super();
    }
    getName(){
        return "InvokeReplyPacket";
    }
    encode(){
        super.encode.call(this);
        this.writeString(this.jgname);
        this.writeString(this.path);
        this.writeBuffer(this.data);
    }
    decode(){
        super.decode.call(this);
        this.jgname = this.readString();
        this.path = this.readString();
        this.data = this.readBuffer();
    }
}

export = InvokeReplyPacket;
