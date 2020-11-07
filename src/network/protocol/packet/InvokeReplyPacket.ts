import BasePacket from "../BasePacket";

class InvokeReplyPacket extends BasePacket{
	public static packet_id : number = 8;
    public jgname:string="";
    public path:string="";
    public data:Buffer;
    
    constructor(){
        super();
        this.data = Buffer.allocUnsafe(1400);
    }
    release(){
        super.release.call(this);
		
        this.data = Buffer.allocUnsafe(0);
    }
    getName(){
        return "InvokeReplyPacket";
    }
    encode(){
        super.encode.call(this);

        this.enlarge(this.data.length+1400);

        this.writeString(this.jgname);
        this.writeString(this.path);
        this.writeLargeBuffer(this.data);
    }
    decode(){
        super.decode.call(this);
        this.jgname = this.readString();
        this.path = this.readString();
        this.data = this.readLargeBuffer();
    }
}

export default InvokeReplyPacket;
