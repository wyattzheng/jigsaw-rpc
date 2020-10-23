import AbstractNetworkClient = require("../AbstractNetworkClient");
import Packet = require("../protocol/Packet");
import AbstractRequest = require("./AbstractRequest");
import Path = require("./Path");
import RequestState = require("./RequestState");
import BaseRequest = require("./BaseRequest")
import SimplePacketRouter = require("./packetrouter/SimplePacketRouter");
import InvokePacket = require("../protocol/packet/InvokePacket");
import InvokeReplyPacket = require("../protocol/packet/InvokeReplyPacket");
import SliceAckPacket = require("../protocol/packet/SliceAckPacket");
import PacketSlicer = require("../request/PacketSlicer");

class InvokeRequest extends BaseRequest<Buffer> {
    private path : Path;
    private data : Buffer;
    private src_jgname : string;
    private packet_slicer : PacketSlicer;

    protected router : SimplePacketRouter;
    
    constructor(src_jgname: string,path : Path,data : Buffer,router : SimplePacketRouter,seq:number){
        super(router,seq);
        this.router = router;

        this.path = path;
        this.data = data;
        this.src_jgname = src_jgname;

        this.packet_slicer = new PacketSlicer(this.buildPacket(),this.getRequestId());

        this.once("done",()=>{
            this.packet_slicer.close();
        });
        
        this.preloadDomain();
    }
    private buildPacket(){
        let pk=new InvokePacket();
        pk.request_id = this.getRequestId();

        pk.data=this.data;
        pk.dst_path=this.path;
        pk.src_jgname = this.src_jgname;

        pk.encode();

        return pk;
    }

    private async preloadDomain(){
        try{
            await this.router.preload(this.path.jgname);
            this.setState(RequestState.BUILT);

        }catch(err){
            this.setState(RequestState.FAILED);
        }
    }
    public getName(){
        return "InvokeRequest";
    }
    protected async send(){

        if(this.packet_slicer.isAllDone()){
            if(this.packet_slicer.isFailed())
                throw new Error("packet slicer failed");

            await this.router.sendPacket(this.path.jgname,this.packet_slicer.getEmptySlice());
        }else{
            let sliceids = this.packet_slicer.getPartSlices();
            for(let sliceid of sliceids){
                await this.router.sendPacket(this.path.jgname,this.packet_slicer.getSlicePacket(sliceid));
            }
        }
                

    }

    protected handlePacket(p : Packet){
        if(this.state!=RequestState.PENDING)
            return;
            
        if(p.getName() == "InvokeReplyPacket"){
            let pk = p as InvokeReplyPacket;
            this.setResult(pk.data);
        }else if(p.getName() == "SliceAckPacket"){
            let pk = p as SliceAckPacket;
            
            this.packet_slicer.ackSlicePacket(pk.partid);
        }
    }
    
}

export = InvokeRequest;
