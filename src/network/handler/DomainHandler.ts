import AbstractHandler from "./AbstractHandler";
import Packet from "../protocol/Packet";
import DomainReplyPacket from "../protocol/packet/DomainReplyPacket";
import DomainQueryPacket from "../protocol/packet/DomainQueryPacket";
import DomainStorage from "../domain/server/DomainStorage";
import DomainUpdatePacket from "../protocol/packet/DomainUpdatePacket";
import ErrorPacket from "../protocol/packet/ErrorPacket";
import IRouter from "../router/IRouter";
import NetRoute from "../router/route/NetRoute";


class DomainHandler extends AbstractHandler{
    public storage : DomainStorage;
    public router : IRouter;

    constructor(router:IRouter){
        super(router);
        this.router = router;

        this.storage = new DomainStorage();
        this.router.plug("DomainQueryPacket",this.handlePacket.bind(this));
        this.router.plug("DomainUpdatePacket",this.handlePacket.bind(this));
        
    }
    protected onPacket(p:Packet):void{
        if(p.getName() == "DomainQueryPacket"){
            let pk = p as DomainQueryPacket;

            let r_pk = new DomainReplyPacket();
            let addr = this.storage.getAddress(pk.jgname);
            r_pk.address = addr.address;
            r_pk.port = addr.port;
            r_pk.request_id=pk.request_id;
            
            this.router.sendPacket(r_pk,new NetRoute(pk.reply_info.port,pk.reply_info.address));    

        }else if(p.getName() == "DomainUpdatePacket"){
            let pk = p as DomainUpdatePacket;
            this.storage.setAddress(pk.jgname,pk.addrinfo);
        

        }else
            throw new Error("recv an unknown packet");

    }
    protected handlePacket(p:Packet):void{
        try{
            this.onPacket(p);
        }catch(err){
            let pk=new ErrorPacket();
            pk.error = err;
            this.router.sendPacket(pk,new NetRoute(p.reply_info.port,p.reply_info.address));
        }

    }

}

export default DomainHandler;
