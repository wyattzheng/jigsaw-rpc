import AddressInfo from "../../domain/AddressInfo";
import BasePacket from "../BasePacket";

class DomainReplyPacket extends BasePacket{
	public static packet_id : number = 4;

    public jgname:string="";
    public address_set:Array<AddressInfo>=[];
    constructor(){
        super();
    }
    getName(){
        return "DomainReplyPacket";
    }
    encode(){
        super.encode.call(this);
        this.writeString(this.jgname);
        this.writeUInt16(this.address_set.length);
        for(let addr of this.address_set){
            this.writeString(addr.stringify());
        }
        
    }
    decode(){
        super.decode.call(this);
        this.jgname = this.readString();
        let setlen = this.readUInt16();
        for(let i=0;i<setlen;i++){
            let str = this.readString();
            this.address_set.push(AddressInfo.parse(str));           
        }
    }
}

export default DomainReplyPacket;
