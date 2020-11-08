import IHandler from "./IHandler";
import IPacket from "../protocol/IPacket";
import DomainReplyPacket from "../protocol/packet/DomainReplyPacket";
import DomainQueryPacket from "../protocol/packet/DomainQueryPacket";
import DomainUpdatePacket from "../protocol/packet/DomainUpdatePacket";

import RegistryStorage from "../domain/server/RegistryStorage";
import ErrorPacket from "../protocol/packet/ErrorPacket";
import IRouter from "../router/IRouter";
import NetRoute from "../router/route/NetRoute";


class DomainHandler implements IHandler{
    public storage : RegistryStorage;
    public router : IRouter;

    constructor(router:IRouter){
        this.router = router;

        this.storage = new RegistryStorage();
        this.router.plug("DomainQueryPacket",this.handlePacket.bind(this));
        this.router.plug("DomainUpdatePacket",this.handlePacket.bind(this));
        
    }
    protected onPacket(p:IPacket):void{
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
    public handlePacket(p:IPacket):void{
        try{
            this.onPacket(p);
        }catch(err){
            let pk=new ErrorPacket();
            pk.error = err;
            let reply_info = p.getReplyInfo();
            this.router.sendPacket(pk,new NetRoute(reply_info.port,reply_info.address));
        }

    }

}

export default DomainHandler;
