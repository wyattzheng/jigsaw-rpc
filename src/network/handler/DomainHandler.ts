import IHandler from "./IHandler";
import IPacket from "../protocol/IPacket";
import DomainReplyPacket from "../protocol/packet/DomainReplyPacket";
import DomainQueryPacket from "../protocol/packet/DomainQueryPacket";
import DomainUpdatePacket from "../protocol/packet/DomainUpdatePacket";

import RegistryStorage from "../domain/server/RegistryStorage";
import ErrorPacket from "../protocol/packet/ErrorPacket";
import IRouter from "../router/IRouter";
import NetRoute from "../router/route/NetRoute";
import DomainPurgePacket from "../protocol/packet/DomainPurgePacket";
import DomainPurgeNotifyPacket from "../protocol/packet/DomainPurgeNotifyPacket";
import LimitedMap from "../../utils/LimitedMap";
import AddressInfo from "../domain/AddressInfo";


class DomainHandler implements IHandler{
    public storage : RegistryStorage;
    public router : IRouter;

    private queryplug : number;
    private updateplug : number;
    private purgeplug : number;

    private recent_clients = new LimitedMap<string,AddressInfo>(100);
    
    constructor(router:IRouter){
        this.router = router;

        this.storage = new RegistryStorage();
        this.queryplug = this.router.plug("DomainQueryPacket",this.handlePacket.bind(this));
        this.updateplug = this.router.plug("DomainUpdatePacket",this.handlePacket.bind(this));
        this.purgeplug = this.router.plug("DomainPurgePacket",this.handlePacket.bind(this));
        
        this.storage.getEventEmitter().on("DomainPurgeEvent",this.handlePurgeEvent.bind(this));
    }
    private handlePurgeEvent(jgid:string){
        let pk = new DomainPurgeNotifyPacket();
        pk.jgid = jgid;

        let keys = this.recent_clients.getMap().keys();

//        console.log(pk,keys)
        for(let key of keys){
            let addr = this.recent_clients.get(key);
            this.router.sendPacket(pk,new NetRoute(addr.port,addr.address));
        }
        
    }
    protected onPacket(p:IPacket):void{

        if(p.getName() == "DomainQueryPacket"){
            let pk = p as DomainQueryPacket;

            let r_pk = new DomainReplyPacket();

            let addr_set = this.storage.queryAddress(pk.jgname);
            r_pk.address_set = addr_set;

            r_pk.request_id=pk.request_id;
            
            this.router.sendPacket(r_pk,new NetRoute(pk.reply_info.port,pk.reply_info.address));    

        }else if(p.getName() == "DomainUpdatePacket"){
            let pk = p as DomainUpdatePacket;
            
            this.recent_clients.set(pk.reply_info.stringify(),pk.reply_info);

            if(pk.can_update)
                for(let info of pk.addrinfos){
                    this.storage.setAddress(pk.jgid,pk.jgname,info);
            }

        }else if(p.getName() == "DomainPurgePacket"){

            let pk = p as DomainPurgePacket;

            let r_pk = new DomainReplyPacket();
            r_pk.request_id = pk.request_id;
            this.storage.removeAddress(pk.jgid);

            this.router.sendPacket(r_pk,new NetRoute(pk.reply_info.port,pk.reply_info.address));    
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
    async close(){
        this.router.unplug("DomainQueryPacket",this.queryplug);
        this.router.unplug("DomainUpdatePacket",this.updateplug);
        this.router.unplug("DomainPurgePacket",this.purgeplug);
        
    }

}

export default DomainHandler;
