import IBuilderManager from "../protocol/builder/manager/IBuilderManager";
import IPacket from "../protocol/IPacket";
import SliceAckPacket from "../protocol/packet/SliceAckPacket";
import SlicePacket from "../protocol/packet/SlicePacket";
import IRouter from "../router/IRouter";
import NetRoute from "../router/route/NetRoute";
import IHandler from "./IHandler";

type Handler = (p : IPacket) => void;

class SliceHandler implements IHandler{
	protected builder_manager : IBuilderManager<SlicePacket,IPacket>;
    protected packet_handler : Handler = ()=>{};
    protected router : IRouter;

    constructor(router : IRouter,builder_manager : IBuilderManager<SlicePacket,IPacket>){
        this.router = router;

        this.builder_manager = builder_manager;
        this.router.plug("SlicePacket",this.handlePacket.bind(this));
        
    }
    setHandler(handler : Handler){
        this.packet_handler = handler;
    }
    public handlePacket(p : IPacket){
        let spk = p as SlicePacket;
        let manager = this.builder_manager;
        
        if(!manager.hasBuilder(spk.buildkey))
            manager.createBuilder(spk.buildkey,spk.partmax);

        
        manager.addPart(spk.buildkey,spk);
        
        if(manager.isDone(spk.buildkey)){
            let built=manager.getBuilt(spk.buildkey);
            if(!built.isBuilt())
                built.decode();
            built.setReplyInfo(spk.reply_info);
            
            
            this.packet_handler(built);
        }

        let ack = new SliceAckPacket();
        ack.request_id = spk.request_id;
        ack.partid = spk.partid;

        this.router.sendPacket(ack,new NetRoute(spk.reply_info.port,spk.reply_info.address));    
    }


}


export default SliceHandler;
