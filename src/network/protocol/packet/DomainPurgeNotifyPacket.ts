import BasePacket from "../BasePacket";

class DomainPurgeNotifyPacket extends BasePacket{
	public static packet_id : number = 13;

    public jgid : string = "";
    getName(){
        return "DomainPurgeNotifyPacket";
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

export default DomainPurgeNotifyPacket;
