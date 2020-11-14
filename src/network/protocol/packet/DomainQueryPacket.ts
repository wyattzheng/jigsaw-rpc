import BasePacket from "../BasePacket";
class DomainQueryPacket extends BasePacket{
	public static packet_id : number = 5;

    public regpath : string = "";
    getName(){
        return "DomainQueryPacket";
    }
    constructor(){
        super();

    }
    encode(){
        super.encode.call(this);
        this.writeString(this.regpath);
        
    }
    decode(){
        super.decode.call(this);
        this.regpath = this.readString();

    }

}

export default DomainQueryPacket;
