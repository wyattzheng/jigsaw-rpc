import IHandler from "./IHandler";
import IPacket from "../protocol/IPacket";
import ErrorPacket from "../protocol/packet/ErrorPacket";
import IRouter from "../router/IRouter";
import NetRoute from "../router/route/NetRoute";
import PingPacket from "../protocol/packet/PingPacket";
import PongPacket from "../protocol/packet/PongPacket";
import DomainPurgeNotifyPacket from "../protocol/packet/DomainPurgeNotifyPacket";
import { TypedEmitter } from "tiny-typed-emitter";

interface HandlerEvent{
    error:(err:Error)=>void;
    domain_purged:(jgid:string)=>void
}
class DomainClientHandler implements IHandler{
    private router : IRouter;
    private pingplug : number;
    private purgeplug : number;
    private eventEmitter = new TypedEmitter<HandlerEvent>();
    constructor(router:IRouter){
        this.router = router;

        this.pingplug = this.router.plug("PingPacket",this.handlePacket.bind(this));
        this.purgeplug = this.router.plug("DomainPurgeNotifyPacket",this.handlePacket.bind(this));

    }
    public getEventEmitter(){
        return this.eventEmitter;
    }
    protected async onPacket(p:IPacket):Promise<void>{
        
        if(p.getName() == "PingPacket"){
            let pk = p as PingPacket;

            let r_pk = new PongPacket();
            r_pk.request_id=pk.request_id;
            
        
            await this.router.sendPacket(r_pk,new NetRoute(pk.reply_info.port,pk.reply_info.address));    
        }else if(p.getName() == "DomainPurgeNotifyPacket"){
            let pk = p as DomainPurgeNotifyPacket;
            
            this.eventEmitter.emit("domain_purged",pk.jgid);


        }else
            throw new Error("recv an unknown packet");

    }
    public async handlePacket(p:IPacket):Promise<void>{
        try{
            await this.onPacket(p);
        }catch(err){
            let pk=new ErrorPacket();
            pk.error = err;
            let reply_info = p.getReplyInfo();

            await this.router.sendPacket(pk,new NetRoute(reply_info.port,reply_info.address)).catch((err:Error)=>{

            });
        }

    }
    public async close(){
        this.router.unplug("PingPacket",this.pingplug);
        this.router.unplug("DomainPurgeNotifyPacket",this.purgeplug);

    }

}

export default DomainClientHandler;
