import AddressInfo from "../../domain/AddressInfo";
import BasePacket from "../BasePacket";
class DomainUpdatePacket extends BasePacket{
	public static packet_id : number = 6;

    public jgname : string = "";
    public addrinfo : AddressInfo = new AddressInfo("",-1);
    constructor(){
        super();

    }
    getName(){
        return "DomainUpdatePacket";
    }
    encode(){
        super.encode.call(this);
        this.writeString(this.jgname);
        this.writeString(this.addrinfo.address);
        this.writeUInt16(this.addrinfo.port);
        
    }
    decode(){
        super.decode.call(this);
        this.jgname = this.readString();
        this.addrinfo.address = this.readString();
        this.addrinfo.port = this.readUInt16();
    }

}

export default DomainUpdatePacket;
