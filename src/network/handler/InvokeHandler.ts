import NetPacketRouter = require("../request/packetrouter/NetPacketRouter");
import AbstractHandler = require("./AbstractHandler");
import Packet = require("../protocol/Packet");
import DomainReplyPacket = require("../protocol/packet/DomainReplyPacket");
import DomainQueryPacket = require("../protocol/packet/DomainQueryPacket");
import DomainStorage = require("../domain/server/DomainStorage");
import DomainUpdatePacket = require("../protocol/packet/DomainUpdatePacket");
import ErrorPacket = require("../protocol/packet/ErrorPacket");
import SimplePacketRouter = require("../request/packetrouter/SimplePacketRouter");
import { TypedEmitter } from "tiny-typed-emitter";
import InvokePacket = require("../protocol/packet/InvokePacket");
import InvokeReplyPacket = require("../protocol/packet/InvokeReplyPacket");
import Path = require("../request/Path");
import InvokeRequest = require("../request/InvokeRequest");
import SlicePacket = require("../protocol/packet/SlicePacket");
import AddressInfo = require("../domain/AddressInfo");
import PacketBuilder = require("../protocol/builder/PacketBuilder");
import PacketSlicer = require("../request/PacketSlicer");
import SliceAckPacket = require("../protocol/packet/SliceAckPacket");
import Defer = require("../../utils/Defer");
import LimitedMap = require("../../utils/LimitedMap");
const debug = require("debug")("InvokeHandler");


type Handler = (path:Path,buf:Buffer)=>Promise<Buffer>;

class InvokingError extends Error{}

class InvokeHandler extends AbstractHandler{
    public router : NetPacketRouter;
    public handler : Handler;

    private invoke_result? : Packet;
    private invoked : boolean = false;
    private invoking : boolean = false;
    private slicers = new LimitedMap<string,PacketSlicer>(1000);

    constructor(router:NetPacketRouter,handler:Handler){
        super(router);
        this.router = router;
        this.handler = handler;

        this.router.plug("InvokePacket",this.handlePacket.bind(this));
        
    }
    protected async getResponsePacket(p:Packet):Promise<Packet>{
        if(p.getName() == "InvokePacket"){
            if(this.invoking){
                throw new InvokingError("request is invoking target...");
            }
            this.invoking = true;

            let pk = p as InvokePacket;

            let r_pk = new InvokeReplyPacket();

            let ret_data = await this.handler(pk.dst_path,pk.data);

            r_pk.request_id = pk.request_id;
            r_pk.data = ret_data;


            return r_pk;
        }else
            throw new Error("not a correct packet");
    }

    private sendInvokeResult(slicer: PacketSlicer,target : AddressInfo){
        if(!this.invoked)
            throw new Error("doesn't have invoked result right now");

        let sliceids = slicer.getPartSlices();

        for(let id of sliceids){
            this.router.sendPacket(slicer.getSlicePacket(id),target.port,target.address);
        }

    }
    protected async handlePacket(p:Packet){
        
        if(this.invoked){
            if(this.slicers.has(p.request_id))
               this.sendInvokeResult(this.slicers.get(p.request_id) as PacketSlicer, p.reply_info);
            return;
        }
            
        try{
            this.invoke_result = await this.getResponsePacket(p);

        }catch(err){
            if(err instanceof InvokingError)
                return;

            let pk=new ErrorPacket();
            pk.error = err;
            pk.request_id = p.request_id;

            this.invoke_result = pk;
            
        }
        this.invoked = true;
        
        let build_req = Math.random() + "-build";
        let packet_slicer = new PacketSlicer(this.invoke_result as Packet,build_req);

        this.slicers.set(p.request_id,packet_slicer);

        let refid=this.router.plug(build_req,(p:Packet)=>{
            let ack = p as SliceAckPacket;
            packet_slicer.ackSlicePacket(ack.partid);
        });

        packet_slicer.once("alldone",()=>{
            this.router.unplug(build_req,refid);
            debug("alldone","requestid:",p.request_id,"build_req",build_req);
        });
        

        debug("invoked, start to reply","requestid:",p.request_id,"build_req",build_req);

        this.sendInvokeResult(packet_slicer,p.reply_info);
    }

}

export = InvokeHandler;
