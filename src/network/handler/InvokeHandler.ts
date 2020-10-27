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
import LimitedMap = require("../../utils/LimitedMap");
import util = require("util")
const sleep = util.promisify(setTimeout)
const debug = require("debug")("InvokeHandler");

type Handler = (path:Path,buf:Buffer)=>Promise<Buffer>;

class InvokingError extends Error{}

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
    public router : NetPacketRouter;
    public handler : Handler;
    public state : string = "starting";
    private invokers = new LimitedMap<string,Invoker>(500);
    private reply_ref : number= 0;

    constructor(router:NetPacketRouter,handler:Handler){
        super(router);
        this.router = router;
        this.handler = handler;

        this.router.plug("InvokePacket",this.handlePacket.bind(this));
        
        this.router.on("ready",()=>{
            this.state = "ready";
        });
        this.router.on("close",()=>{
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
        this.setReplyRef(0);
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
            
        this.setReplyRef(+1);
        let slicer = invoker.slicer as PacketSlicer;
        let sliceids = slicer.getPartSlices();

        try{
            for(let id of sliceids){
                if(this.state != "ready")
                    break;
    
                this.router.sendPacket(slicer.getSlicePacket(id),target.port,target.address);
                await sleep(0);
            }    
        }catch(err){

        }

        this.setReplyRef(-1);
    }
    private setReplyRef(offset:number){
        this.reply_ref+=offset;
        if(this.reply_ref == 0 && this.state == "closing"){
            this.state = "close";
        }
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
            invoke_pk.release();
            invoker.close();
        
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

}

export = InvokeHandler;
