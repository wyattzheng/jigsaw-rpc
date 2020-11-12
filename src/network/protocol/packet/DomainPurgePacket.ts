import BasePacket from "../BasePacket";
class DomainPurgePacket extends BasePacket{
	public static packet_id : number = 12;

    public jgid : string = "";
    getName(){
        return "DomainPurgePacket";
    }
    constructor(){
        super();

    }
    encode(){
        super.encode.call(this);
        this.writeString(this.jgid);
        
    }
    decode(){
        super.decode.call(this);
        this.jgid = this.readString();

    }

}

export default DomainPurgePacket;
