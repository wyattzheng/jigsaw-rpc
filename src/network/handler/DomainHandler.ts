import IHandler from "./IHandler";
import IPacket from "../protocol/IPacket";
import DomainReplyPacket from "../protocol/packet/DomainReplyPacket";
import DomainQueryPacket from "../protocol/packet/DomainQueryPacket";
import DomainUpdatePacket from "../protocol/packet/DomainUpdatePacket";

import RegistryStorage from "../../domain/server/NameRegistryStorage";
import ErrorPacket from "../protocol/packet/ErrorPacket";
import IRouter from "../router/IRouter";
import NetRoute from "../router/route/NetRoute";
import DomainPurgePacket from "../protocol/packet/DomainPurgePacket";
import DomainPurgeNotifyPacket from "../protocol/packet/DomainPurgeNotifyPacket";
import LimitedMap from "../../utils/LimitedMap";
import AddressInfo from "../../domain/AddressInfo";
import { TypedEmitter } from "tiny-typed-emitter";
import PongPacket from "../protocol/packet/PongPacket";
import IRegistryStorage from "../../domain/server/IRegistryStorage";
import PacketParsingError from "../../error/PacketParsingError";


interface HandlerEvent{
    error: (err:Error)=>void;
}
class DomainHandler implements IHandler{
    private storage : IRegistryStorage;
    private router : IRouter;

    private eventEmitter = new TypedEmitter<HandlerEvent>();
    private queryplug : number;
    private updateplug : number;
    private purgeplug : number;
    private clear_node_loop : NodeJS.Timeout;
    private recent_clients = new LimitedMap<string,AddressInfo>(100);
    
    constructor(router:IRouter){
        this.router = router;

        this.storage = new RegistryStorage();
        this.queryplug = this.router.plug("DomainQueryPacket",this.handlePacket.bind(this));
        this.updateplug = this.router.plug("DomainUpdatePacket",this.handlePacket.bind(this));
        this.purgeplug = this.router.plug("DomainPurgePacket",this.handlePacket.bind(this));
        
        this.storage.getEventEmitter().on("DomainPurgeEvent",this.handlePurgeEvent.bind(this));

        this.clear_node_loop = setInterval(()=>{
            this.storage.clearExpiredNodes();
        },5*1000);
    }
    getEventEmitter(){
        return this.eventEmitter;
    }
    getStorage(){
        return this.storage;
    }
    private async handlePurgeEvent(jgid:string){
        let pk = new DomainPurgeNotifyPacket();
        pk.jgid = jgid;

        let keys = this.recent_clients.getMap().keys();

        for(let key of keys){
            let addr = this.recent_clients.get(key);
            await this.router.sendPacket(pk,new NetRoute(addr.port,addr.address));
        }
    }
    protected async onPacket(p:IPacket):Promise<void>{

        if(p.getName() == "DomainQueryPacket"){
            let pk = p as DomainQueryPacket;

            let r_pk = new DomainReplyPacket();

            let addr_set = this.storage.queryNode(pk.regpath);
            r_pk.address_set = addr_set;

            r_pk.request_id=pk.request_id;
            
            await this.router.sendPacket(r_pk,new NetRoute(pk.reply_info.port,pk.reply_info.address));    

        }else if(p.getName() == "DomainUpdatePacket"){
            let pk = p as DomainUpdatePacket;
            
            this.recent_clients.set(pk.reply_info.stringify(),pk.reply_info);

            if(pk.can_update){
                this.storage.setNode(pk.jgid,pk.jgname,pk.addrinfo);
            }
            

        }else if(p.getName() == "DomainPurgePacket"){

            let pk = p as DomainPurgePacket;
            
            this.storage.removeNode(pk.jgid,pk.jgname);

            let r_pk = new PongPacket();
            r_pk.request_id=pk.request_id;
            await this.router.sendPacket(r_pk,new NetRoute(pk.reply_info.port,pk.reply_info.address));    

        }else
            throw new PacketParsingError("recv an unknown packet");

    }
    public async handlePacket(p:IPacket):Promise<void>{
        try{
            await this.onPacket(p);
        }catch(err){
            let pk=new ErrorPacket();
            pk.error = err;
            let reply_info = p.getReplyInfo();
            await this.router.sendPacket(pk,new NetRoute(reply_info.port,reply_info.address)).catch((err)=>{
                
            });
        }

    }
    async close(){
        this.router.unplug("DomainQueryPacket",this.queryplug);
        this.router.unplug("DomainUpdatePacket",this.updateplug);
        this.router.unplug("DomainPurgePacket",this.purgeplug);
        
        clearInterval(this.clear_node_loop);
    }

}

export default DomainHandler;
