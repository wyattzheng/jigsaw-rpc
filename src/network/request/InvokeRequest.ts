import Packet from "../protocol/Packet";
import Path from "./Path";
import BaseRequest from "./BaseRequest"
import InvokePacket from "../protocol/packet/InvokePacket";
import InvokeReplyPacket from "../protocol/packet/InvokeReplyPacket";
import SliceAckPacket from "../protocol/packet/SliceAckPacket";
import PacketSlicer from "../request/PacketSlicer";
import InvokeTimeoutError from "../../error/InvokeTimeoutError";
import ErrorPacket from "../protocol/packet/ErrorPacket";
import IRouter from "../router/IRouter";
import IRoute from "../router/route/IRoute";
import PacketParsingError from "../../error/PacketParsingError";


class InvokeRequest extends BaseRequest<Buffer> {
    private path : Path;
    private data : Buffer;
    private src_jgname : string;
    private packet_slicer : PacketSlicer;
    private route : IRoute;
    private isJson : boolean = false;
    private isResultJson : boolean = false;

    protected router : IRouter;
    
    constructor(src_jgname: string,path : Path,data : Buffer,isJSON:boolean,route:IRoute,router : IRouter,seq:number){
        super(router,seq,10*1000); // 10s timeout

        this.router = router;

        this.path = path;
        this.data = data;
        this.src_jgname = src_jgname;
        this.route = route;

        this.isJson = isJSON;
        this.packet_slicer = new PacketSlicer(this.buildPacket(),this.getRequestId());

        this.getLifeCycle().on("closed",()=>{
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
        pk.isJSON = this.isJson;
        
        pk.encode();

        return pk;
    }

    private async preloadDomain(){
        try{
            await this.route.preload();
            
            this.getLifeCycle().setState("ready");
        }catch(err){
            this.getLifeCycle().setDead(err);
        }
        
    }
    public getName(){
        return "InvokeRequest";
    }
    protected async send() : Promise<void>{
        if(this.packet_slicer.isAllDone()){
            if(this.packet_slicer.isFailed())
                throw new PacketParsingError("packet slicer failed");
            
            await this.router.sendPacket(this.packet_slicer.getEmptySlice(),this.route);
        }else{
            let sliceids = this.packet_slicer.getPartSlices();
            for(let sliceid of sliceids){
                await this.router.sendPacket(this.packet_slicer.getSlicePacket(sliceid),this.route);
            }
        } 
    }
    protected getTimeoutError(){
        return new InvokeTimeoutError(this.timeout_duration,this.src_jgname,this.path.stringify(),this.data.length,this.req_seq);
    }
    protected handleErrorPacket(p : Packet){
        let pk = p as ErrorPacket;
        throw pk.error;
        
//        throw new InvokeRemoteError(pk.error,this.src_jgname,this.path.stringify(),this.data.length,this.req_seq);
    }
    public getResultType(){
        return this.isResultJson ? 1 : 0;
    }
    protected async handlePacket(p : Packet){
        if(this.getLifeCycle().getState()!="closing")
            return;
            
        if(p.getName() == "InvokeReplyPacket"){
            let pk = p as InvokeReplyPacket;
            let data = pk.data;
            this.isResultJson = pk.isJSON;
            
            p.release();
            this.setResult(data);
        }else if(p.getName() == "SliceAckPacket"){
            let pk = p as SliceAckPacket;
            
            this.packet_slicer.ackSlicePacket(pk.partid);
        }
    }
    
}

export default InvokeRequest;
