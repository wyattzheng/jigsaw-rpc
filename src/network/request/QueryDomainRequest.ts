import BaseRequest from "./BaseRequest";
import AddressInfo from "../domain/AddressInfo";
import Packet from "../protocol/Packet";
import DomainQueryPacket from "../protocol/packet/DomainQueryPacket";
import RequestState from "./RequestState";
import DomainReplyPacket from "../protocol/packet/DomainReplyPacket";
import IRouter from "../router/IRouter";
import NetRoute from "../router/route/NetRoute";

type QueryResult = Array<{jgid:string,jgname:string,address:AddressInfo,updateTime:number}>;

class QueryDomainRequest extends BaseRequest<QueryResult>{
    private regpath : string = "";
    private dst : AddressInfo ;
    constructor(regpath:string,dst:AddressInfo,router : IRouter,seq_id : number){
        super(router,seq_id,1*1000); //1s timeout

        this.regpath = regpath;
        this.dst = dst;
        
        this.getLifeCycle().setState("ready");
    }
    async send(){
        let pk=new DomainQueryPacket();

        pk.request_id = this.getRequestId();
        pk.regpath = this.regpath;
    
        await this.router.sendPacket(pk,new NetRoute(this.dst.port,this.dst.address));
    }
    getName(){
        return "QueryDomainRequest";
    }
    async handlePacket(p : Packet){
        if(p.getName() == "DomainReplyPacket"){
            let pk = p as DomainReplyPacket;
            this.setResult(pk.address_set);
        }else
            throw new Error("recv an unknown packet");
    }
}

export default QueryDomainRequest