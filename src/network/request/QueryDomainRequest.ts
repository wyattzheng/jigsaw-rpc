import BaseRequest = require("./BaseRequest");
import AddressInfo = require("../domain/AddressInfo");
import Packet = require("../protocol/Packet");
import DomainQueryPacket = require("../protocol/packet/DomainQueryPacket");
import RequestState = require("./RequestState");
import DomainReplyPacket = require("../protocol/packet/DomainReplyPacket");
import IRouter = require("../router/IRouter");
import NetRoute = require("../router/route/NetRoute");

class QueryDomainRequest extends BaseRequest<AddressInfo>{
    private jgname : string = "";
    private dst : AddressInfo ;
    constructor(jgname:string,dst:AddressInfo,router : IRouter,seq_id : number){
        super(router,seq_id,1*1000); //1s timeout

        this.jgname = jgname;
        this.dst = dst;
        
        this.setState(RequestState.BUILT);
    }
    async send(){
        let pk=new DomainQueryPacket();

        pk.request_id = this.getRequestId();
        pk.jgname = this.jgname;

        this.router.sendPacket(pk,new NetRoute(this.dst.port,this.dst.address));
    }
    getName(){
        return "QueryDomainRequest";
    }
    handlePacket(p : Packet){
        if(p.getName() == "DomainReplyPacket"){
            let pk = p as DomainReplyPacket;
            this.setResult(new AddressInfo(pk.address,pk.port));
        }else
            throw new Error("recv an unknown packet");
    }
}

export = QueryDomainRequest