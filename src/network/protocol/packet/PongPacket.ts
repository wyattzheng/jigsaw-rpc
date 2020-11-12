import BasePacket from "../BasePacket";

class PongPacket extends BasePacket{
	public static packet_id : number = 11;
    public jgname : string = "";

    getName(){
        return "PongPacket";
    }
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

export default PongPacket;
