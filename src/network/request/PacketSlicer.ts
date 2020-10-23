import { TypedEmitter } from "tiny-typed-emitter";
import Packet from "../protocol/Packet";
import SlicePacket from "../protocol/packet/SlicePacket";
const debug = require("debug")("PacketSlicer");

interface PacketSlicerEvent{
    alldone : ()=>void
}

class PacketSlicer extends TypedEmitter<PacketSlicerEvent>{
    private packet : Packet;
    private unsent_packets = new Set<number>();
    private slicelen = 1024*50;
    private packet_data : Buffer = Buffer.allocUnsafe(0)
    private packets_send_limit : number = 20;
    private timeout : NodeJS.Timeout;
    private alldone = false;
    private failed = false;
    private req_id : string;
    constructor(pk : Packet,req_id: string){
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
        this.setAllDone(false);
    }
    isAllDone(){
        return this.alldone;
    }
    isFailed(){
        return this.failed;
    }
    private initUnsent(){
        for(let j = 0;j<this.getSliceCount();j++)
            this.unsent_packets.add(j);

    }
    public getSliceCount() : number{


        let buf = this.packet_data;

        let slicelen = this.slicelen;
        let slicecount = buf.length % slicelen == 0 ? buf.length/slicelen : Math.floor(buf.length/slicelen) + 1;
        return slicecount;
    }
    public getSlicePacket(partid:number) : Packet {
        
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
        clearTimeout(this.timeout);
        this.emit("alldone");
        
    }
    public ackSlicePacket(partid:number){
        debug("ack",this.req_id,"left:",this.unsent_packets.size);
        this.unsent_packets.delete(partid);
        if(this.unsent_packets.size <= 0){
            this.setAllDone(false);
        }
    }
    public getPartSlices() : Array<number>{

        let unsent = Array.from(this.unsent_packets);
        let tosend = unsent.slice(0,this.packets_send_limit);
        debug("sendslice",this.req_id,"left:",this.unsent_packets.size);

        return tosend;
    }
    public getEmptySlice() : Packet{
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

export = PacketSlicer;