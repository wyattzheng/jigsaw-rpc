import AddressInfo from "../../domain/AddressInfo";
import BasePacket from "../BasePacket";

type QueryResult = Array<{jgid:string,jgname:string,address:AddressInfo,updateTime:number}>;

class DomainReplyPacket extends BasePacket{
	public static packet_id : number = 4;

    public regpath:string="";

    public address_set : QueryResult = [];
    constructor(){
        super();
    }
    getName(){
        return "DomainReplyPacket";
    }
    encode(){
        super.encode.call(this);
        this.writeString(this.regpath);
        this.writeUInt16(this.address_set.length);
        for(let item of this.address_set){
            this.writeString(item.jgid);
            this.writeString(item.jgname);
            this.writeString(item.address.stringify());
            this.writeString(item.updateTime + '');
        }
        
    }
    decode(){
        super.decode.call(this);
        this.regpath = this.readString();
        let setlen = this.readUInt16();
        
        for(let i=0;i<setlen;i++){
            let jgid = this.readString();
            let jgname = this.readString();
            let address = AddressInfo.parse(this.readString());
            let updateTime = parseInt(this.readString());
            this.address_set.push({jgid,jgname,address,updateTime});           
        }
    }
}

export default DomainReplyPacket;
