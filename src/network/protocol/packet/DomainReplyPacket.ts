import AddressInfo from "../../domain/AddressInfo";
import BasePacket from "../BasePacket";

type QueryResult = Array<{jgid:string,addr:AddressInfo}>;

class DomainReplyPacket extends BasePacket{
	public static packet_id : number = 4;

    public jgname:string="";
    public address_set : QueryResult = [];
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
        for(let item of this.address_set){
            this.writeString(item.jgid);
            this.writeString(item.addr.stringify());
        }
        
    }
    decode(){
        super.decode.call(this);
        this.jgname = this.readString();
        let setlen = this.readUInt16();
        for(let i=0;i<setlen;i++){
            let jgid = this.readString();
            let addr = AddressInfo.parse(this.readString());
            this.address_set.push({jgid,addr});           
        }
    }
}

export default DomainReplyPacket;
