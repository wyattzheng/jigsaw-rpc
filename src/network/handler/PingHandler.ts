import IHandler from "./IHandler";
import IPacket from "../protocol/IPacket";
import ErrorPacket from "../protocol/packet/ErrorPacket";
import IRouter from "../router/IRouter";
import NetRoute from "../router/route/NetRoute";
import PingPacket from "../protocol/packet/PingPacket";
import PongPacket from "../protocol/packet/PongPacket";


class PingHandler implements IHandler{
    private router : IRouter;
    private pingplug : number;

    constructor(router:IRouter){
        this.router = router;

        this.pingplug = this.router.plug("PingPacket",this.handlePacket.bind(this));
        
    }
    protected onPacket(p:IPacket):void{
        
        if(p.getName() == "PingPacket"){
            let pk = p as PingPacket;

            let r_pk = new PongPacket();
            r_pk.request_id=pk.request_id;
            
            

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
    public async close(){
        this.router.unplug("PingPacket",this.pingplug);

    }

}

export default PingHandler;
