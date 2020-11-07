import AbstractHandler from "./AbstractHandler";
import Packet from "../protocol/Packet";
import DomainReplyPacket from "../protocol/packet/DomainReplyPacket";
import DomainQueryPacket from "../protocol/packet/DomainQueryPacket";
import DomainStorage from "../domain/server/DomainStorage";
import DomainUpdatePacket from "../protocol/packet/DomainUpdatePacket";
import ErrorPacket from "../protocol/packet/ErrorPacket";
import SimplePacketRouter from "../router/packetrouter/SimplePacketRouter";
import { TypedEmitter } from "tiny-typed-emitter";
import InvokePacket from "../protocol/packet/InvokePacket";
import InvokeReplyPacket from "../protocol/packet/InvokeReplyPacket";
import Path from "../request/Path";
import InvokeRequest from "../request/InvokeRequest";
import SlicePacket from "../protocol/packet/SlicePacket";
import AddressInfo from "../domain/AddressInfo";
import PacketBuilder from "../protocol/builder/PacketBuilder";
import PacketSlicer from "../request/PacketSlicer";
import SliceAckPacket from "../protocol/packet/SliceAckPacket";
import LimitedMap from "../../utils/LimitedMap";
import IRouter from "../router/IRouter";
import NetRoute from "../router/route/NetRoute";
import util from "util";


const sleep = util.promisify(setTimeout)
const debug = require("debug")("InvokeHandler");

type Handler = (path:Path,buf:Buffer)=>Promise<Buffer>;

class Invoker{
    public slicer? : PacketSlicer;
    public build_req : string = "";
    private state : string = "invoking"; //invoking,invoked,done,closing


    constructor(){

    }
    setSlicer(slicer : PacketSlicer){
        this.slicer = slicer;
    }
    getState() : string{
        return this.state;
    }
    setState(state : string){

        
        if(state == "invoked" && this.state == "closing"){
            this.state = "invoked";

            this.close();
            return;
        }
            this.state = state;
    }
    close(){
        if(this.state == "done")
            return;

        if(this.state == "invoking"){
            this.state = "closing";
            return;
        }
        if(this.state != "invoked")
            return;
        
        this.state = "done";
        this.slicer?.close();
    }
    

}

class InvokeHandler extends AbstractHandler{
    public router : IRouter;
    public handler : Handler;
    public state : string = "starting";
    private invokers = new LimitedMap<string,Invoker>(500);
    private refs : Map<string,number> = new Map(Object.entries({
        reply:0,
        invokers:0
    }));
    constructor(router:IRouter,handler:Handler){
        super(router);
        this.router = router;
        this.handler = handler;

        this.router.plug("InvokePacket",this.handlePacket.bind(this));
        
        this.router.getEventEmitter().on("ready",()=>{
            this.state = "ready";
        });
        this.router.getEventEmitter().on("close",()=>{
            this.close();
        });

        this.invokers.on("deleted",(item : Invoker)=>{
            item.close();
            
        })

    }
    close(){
        if(this.state == "close")
            return;
        if(this.state == "starting")
            throw new Error("right now starting")
        
        this.closeAllInvokers();
        
        this.state = "closing";
        this.setRef("reply",0);
        
    }
    private closeAllInvokers(){
        let keys = Array.from(this.invokers.getMap().keys());

        debug("closing total invokers:",keys.length);
        for(let key of keys){
            let invoker = this.invokers.get(key);
            invoker.close();
        }
    }
    
    getInvoker(name : string) : Invoker{
        if(!this.invokers.has(name))
            throw new Error("this invoker can not find");
        let invoker = this.invokers.get(name) as Invoker;
        return invoker;
    }
    hasInvoker(name : string){
        return this.invokers.has(name);
    }


    private async sendInvokeResult(invoker : Invoker,target : AddressInfo){
       
       
        if(invoker.getState()!="invoked")
            return;

        if(this.state == "closing")
            return;
            
        this.setRef("reply",+1);
        let slicer = invoker.slicer as PacketSlicer;
        let sliceids = slicer.getPartSlices();

        try{
            for(let id of sliceids){
                if(this.state != "ready")
                    break;
    
                this.router.sendPacket(slicer.getSlicePacket(id),new NetRoute(target.port,target.address));
                await sleep(0);
            }    
        }catch(err){

        }

        this.setRef("reply",-1);
    }

    private async getReplyPacket(invoke_packet:Packet):Promise<Packet>{
        let pk = invoke_packet as InvokePacket;

        try{
            let r_pk = new InvokeReplyPacket();

            let ret_data = await this.handler(pk.dst_path,pk.data);
    
            r_pk.request_id = pk.request_id;
            r_pk.data = ret_data;
            return r_pk;
        }catch(err){
            let err_pk = new ErrorPacket();
            err_pk.request_id = pk.request_id;
            err_pk.error = err;

            return err_pk;
        }
    }
    private async addNewInvoker(invoke_pk:Packet) : Promise<Invoker>{
        this.setRef("invokers",+1);

        let build_req =Math.random() + "-build";


        let invoker = new Invoker();
        this.invokers.set(invoke_pk.request_id,invoker);

        invoker.build_req = build_req;

        let result = await this.getReplyPacket(invoke_pk);
        let slicer = new PacketSlicer(result as Packet,build_req);        

        invoker.setSlicer(slicer);


        let refid=this.router.plug(invoker.build_req,(p:Packet)=>{
            let ack = p as SliceAckPacket;
            slicer.ackSlicePacket(ack.partid);
        });
        slicer.once("alldone",()=>{
                //this.invokers.delete(p.request_id);

            this.setRef("invokers",-1);

            invoke_pk.release();
            invoker.close();
            result.release();
            this.router.unplug(invoker.build_req,refid);
            debug("alldone","requestid:",invoke_pk.request_id,"build_req",invoker.build_req);
        });
        


        invoker.setState("invoked");

        debug("invoked, start to reply","requestid:",invoke_pk.request_id,"build_req",invoker.build_req);

        return invoker;
    }    
    protected async handlePacket(p:Packet){
        if(this.state != "ready")
            return;

        if(this.hasInvoker(p.request_id)){
            let invoker = this.getInvoker(p.request_id);
            

            if(invoker.getState() == "invoked")
                this.sendInvokeResult(invoker, p.reply_info);

            return;
        }
        
        let invoker = await this.addNewInvoker(p);        

        this.sendInvokeResult(invoker,p.reply_info);
    }
    private setRef(ref_type:string,offset:number){
        let ref = this.refs.get(ref_type) as number;
        this.refs.set(ref_type,ref+offset);
        //console.log(this.refs);

        if(this.state == "closing"){
            let alldone = true;
            for(let key of this.refs.keys()){
                let r = this.refs.get(key) as number;
                if(r > 0)
                    alldone = false;
            }
            if(alldone){
                this.state = "close";

            }
        }
    }    

}

export default InvokeHandler;
