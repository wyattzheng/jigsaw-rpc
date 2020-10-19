import BaseRequest = require("./BaseRequest");
import AddressInfo = require("../domain/AddressInfo");
import NetRequestSwitch = require("./switch/NetRequestSwitch");
import Packet = require("../protocol/Packet");
import DomainQueryPacket = require("../protocol/packet/DomainQueryPacket");

class QueryDomainRequest extends BaseRequest<AddressInfo>{
    private jgname : string = "";
    constructor(jgname:string,rswitch : NetRequestSwitch){
        super(rswitch);
        this.jgname = jgname;
    }
    send(){
        let pk=new DomainQueryPacket();

        pk.request_id = this.getRequestId();
        pk.jgname = this.jgname;

        (this.rswitch as NetRequestSwitch).sendPacket(pk);
    }
    handlePacket(p : Packet){
        
    }
}

export = QueryDomainRequest;