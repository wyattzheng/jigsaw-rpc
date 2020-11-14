import AddressInfo from "../../domain/AddressInfo";
import BasePacket from "../BasePacket";
class DomainUpdatePacket extends BasePacket{
	public static packet_id : number = 6;

    public jgid : string = "";
    public jgname : string = "";
    public can_update : boolean = true;
    public addrinfo : AddressInfo = new AddressInfo("",-1);
    constructor(){
        super();

    }
    getName(){
        return "DomainUpdatePacket";
    }
    encode(){
        super.encode.call(this);
        this.writeString(this.jgid);
        this.writeString(this.jgname);
        this.writeUInt16(this.can_update ? 1 : 0);
        this.writeString(this.addrinfo.stringify());
    }
    
    decode(){
        super.decode.call(this);
        this.jgid = this.readString();
        this.jgname = this.readString();
        this.can_update = this.readUInt16() == 1;

        this.addrinfo = AddressInfo.parse(this.readString());
    }

}

export default DomainUpdatePacket;
