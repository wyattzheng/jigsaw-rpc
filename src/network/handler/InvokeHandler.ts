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
    public state : string = "ready"; // ready,invoking,invoked,done
    public invoke_result? : Packet;
    constructor(){
    }
    setResult(result : Packet){
        this.invoke_result = result;
    }
    setDone(){
        if(this.state != "invoked")
            return;
        
        this.state = "done";
        this.invoke_result = undefined;
        this.slicer = undefined;
    }

}

class InvokeHandler extends AbstractHandler{
    public router : NetPacketRouter;
    public handler : Handler;

    private invokers = new LimitedMap<string,Invoker>(500);

    constructor(router:NetPacketRouter,handler:Handler){
        super(router);
        this.router = router;
        this.handler = handler;

        this.router.plug("InvokePacket",this.handlePacket.bind(this));
        
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
    protected async getResponsePacket(p:Packet):Promise<Packet>{
        let pk = p as InvokePacket;

        let r_pk = new InvokeReplyPacket();

        let ret_data = await this.handler(pk.dst_path,pk.data);

        r_pk.request_id = pk.request_id;
        r_pk.data = ret_data;


        return r_pk;
    }

    private async sendInvokeResult(invoker : Invoker,target : AddressInfo){
        if(invoker.state!="invoked")
            throw new Error("doesn't have invoked result right now");

        let slicer = invoker.slicer as PacketSlicer;
        let sliceids = slicer.getPartSlices();

        for(let id of sliceids){
            this.router.sendPacket(slicer.getSlicePacket(id),target.port,target.address);
            await sleep(0);

        }

    }
    
    protected async handlePacket(p:Packet){

        if(this.hasInvoker(p.request_id)){
            let invoker = this.getInvoker(p.request_id);
            //console.log(invoker.state)
            
            if(invoker.state == "invoked")
                this.sendInvokeResult(invoker, p.reply_info);

            return;
        }
        
        let invoker = new Invoker();
        invoker.state = "invoking";
        this.invokers.set(p.request_id,invoker);

        let invoke_result;
        try{
            invoke_result = await this.getResponsePacket(p);
    
        }catch(err){
            let err_pk = new ErrorPacket();
            err_pk.request_id = p.request_id;
            err_pk.error = err;

            invoke_result = err_pk;
        }
        
        /*

        this.router.sendPacket(invoke_result,p.reply_info.port,p.reply_info.address)
        return;
        
        */

        invoker.setResult(invoke_result);    
        
        let build_req = Math.random() + "-build";
        let packet_slicer = new PacketSlicer(invoke_result as Packet,build_req);

        invoker.slicer = packet_slicer;

        let refid=this.router.plug(build_req,(p:Packet)=>{
            let ack = p as SliceAckPacket;
            packet_slicer.ackSlicePacket(ack.partid);
        });

        packet_slicer.once("alldone",()=>{
            try{
                //this.invokers.delete(p.request_id);
                invoker.setDone();
            }catch(err){

            }
            this.router.unplug(build_req,refid);
            debug("alldone","requestid:",p.request_id,"build_req",build_req);
        });
        

        debug("invoked, start to reply","requestid:",p.request_id,"build_req",build_req);
        
        invoker.state = "invoked";

        this.sendInvokeResult(invoker,p.reply_info);
    }

}

export = InvokeHandler;
