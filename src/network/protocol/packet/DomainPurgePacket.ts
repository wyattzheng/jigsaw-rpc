import BasePacket from "../BasePacket";
class DomainPurgePacket extends BasePacket{
	public static packet_id : number = 12;

    public jgid : string = "";
    public jgname : string = "";

    getName(){
        return "DomainPurgePacket";
    }
    constructor(){
        super();

    }
    encode(){
        super.encode.call(this);
        this.writeString(this.jgid);
        this.writeString(this.jgname);
        
    }
    decode(){
        super.decode.call(this);
        this.jgid = this.readString();
        this.jgname = this.readString();

    }

}

export default DomainPurgePacket;
