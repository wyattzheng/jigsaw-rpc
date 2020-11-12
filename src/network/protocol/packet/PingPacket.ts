import BasePacket from "../BasePacket";
class PingPacket extends BasePacket{
	public static packet_id : number = 10;

    getName(){
        return "PingPacket";
    }
    constructor(){
        super();

    }
    encode(){
        super.encode.call(this);
        
    }
    decode(){
        super.decode.call(this);
        
    }

}

export default PingPacket;
