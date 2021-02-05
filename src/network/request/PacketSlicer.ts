import { TypedEmitter } from "tiny-typed-emitter";
import IPacket from "../protocol/IPacket";
import SlicePacket from "../protocol/packet/SlicePacket";
const debug = require("debug")("PacketSlicer");

interface PacketSlicerEvent{
    alldone : ()=>void
}

class PacketSlicer extends TypedEmitter<PacketSlicerEvent>{
    private packet : IPacket;
    private unsent_packets = new Set<number>();
    private slicelen = 20 * 1024;
    private packet_data : Buffer = Buffer.allocUnsafe(0)
    private packets_send_limit : number = 1;
    private timeout : NodeJS.Timeout;
    private alldone = false;
    private failed = false;
    private req_id : string;
    private start_time : number = new Date().getTime();

    constructor(pk : IPacket,req_id: string){
        super();

        if(!pk.isBuilt())
            pk.encode();
        
        this.packet = pk;
        this.packet_data = this.packet.getSlicedData();
        this.req_id = req_id;

        this.timeout = setTimeout(()=>{
            this.failed = true;
            this.setAllDone(true);
            debug("alldone and timeout","build_req",this.req_id);
        },12000);

        this.initUnsent();
    }
    close(){
        this.setAllDone(true);
    }
    isAllDone(){
        return this.alldone;
    }
    isFailed(){
        return this.failed;
    }
    public getPacket(){
        return this.packet;
    }
    private initUnsent(){
        for(let j = 0;j<this.getSliceCount();j++)
            this.unsent_packets.add(j);
    }
    private getSpeed() : number{  //  speed: bytes per s
        let sent = this.getSliceCount() - this.unsent_packets.size
        let sent_bytes = sent * this.slicelen;
        let nowtime = new Date().getTime();
        let dura = Math.max(1,nowtime - this.start_time);
        return Math.floor(sent_bytes/dura*1000);
    }
    private recalcSendLimit(){
        
        let div = 4;
        let send_limit = Math.floor(this.getSpeed() / this.slicelen / div);
        if(send_limit < 1)
            send_limit = 1;
        if(send_limit > 50)
            send_limit = 50;
        
        debug("send_speed = ",this.getSpeed(),"send_limit = ",send_limit)

        this.packets_send_limit = send_limit;
    }
    public getSliceCount() : number{


        let buf = this.packet_data;

        let slicelen = this.slicelen;
        let slicecount = buf.length % slicelen == 0 ? buf.length/slicelen : Math.floor(buf.length/slicelen) + 1;
        return slicecount;
    }
    public getSlicePacket(partid:number) : IPacket {
        
        let buf = this.packet_data;

        let payload = buf.slice(partid*this.slicelen,(partid+1)*this.slicelen);
        let slice = new SlicePacket();
        slice.partid = partid;
        slice.partmax = this.getSliceCount();
        slice.payload = payload;
        slice.request_id = this.req_id;
        slice.buildkey = this.req_id;

        return slice;
    }
    private setAllDone(failed : boolean){
        if(this.alldone)
            return;

        this.alldone = true;
        this.failed = failed;
        this.packet_data = Buffer.allocUnsafe(0);

        clearTimeout(this.timeout);
        this.emit("alldone");
        
    }
    public ackSlicePacket(partid:number){
        debug("ack",this.req_id,"left:",this.unsent_packets.size);

        this.unsent_packets.delete(partid);
        if(this.unsent_packets.size <= 0){
            this.setAllDone(false);
        }

        this.recalcSendLimit();
    }
    public getPartSlices() : Array<number>{

        let unsent = Array.from(this.unsent_packets);
        let tosend = unsent.slice(0,this.packets_send_limit);
        debug("sendslice",this.req_id,"left:",this.unsent_packets.size);

        return tosend;
    }
    public getEmptySlice() : IPacket{
        /*let slice = new SlicePacket();
        slice.partid = -1;
        slice.partmax = this.getSliceCount();
        slice.payload = Buffer.allocUnsafe(0);
        slice.request_id = this.req_id;
        slice.buildkey = this.req_id;

        return slice;*/
        return this.getSlicePacket(0);
    }

}

export default PacketSlicer;