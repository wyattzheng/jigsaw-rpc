import AddressInfo from "../../domain/AddressInfo";
import BasePacket from "../BasePacket";
class DomainUpdatePacket extends BasePacket{
	public static packet_id : number = 6;

    public jgid : string = "";
    public jgname : string = "";
    public addrinfos : Array<AddressInfo> = [];
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
        this.writeUInt16(this.addrinfos.length);
        for(let info of this.addrinfos){

            this.writeString(info.stringify());
        }
    }
    decode(){
        super.decode.call(this);
        this.jgid = this.readString();
        this.jgname = this.readString();
        let len = this.readUInt16();
        let array : Array<AddressInfo> = [];
        for(let i=0;i<len;i++){
            array.push(AddressInfo.parse(this.readString()));
        }

        this.addrinfos = array;
    }

}

export default DomainUpdatePacket;
