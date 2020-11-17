import IHandler from "./IHandler";
import IPacket from "../protocol/IPacket";
import ErrorPacket from "../protocol/packet/ErrorPacket";
import InvokePacket from "../protocol/packet/InvokePacket";
import InvokeReplyPacket from "../protocol/packet/InvokeReplyPacket";
import Path from "../request/Path";
import AddressInfo from "../domain/AddressInfo";
import PacketSlicer from "../request/PacketSlicer";
import SliceAckPacket from "../protocol/packet/SliceAckPacket";
import LimitedMap from "../../utils/LimitedMap";
import IRouter from "../router/IRouter";
import NetRoute from "../router/route/NetRoute";
import LifeCycle from "../../utils/LifeCycle";
import util from "util";
import { TypedEmitter } from "tiny-typed-emitter";
import JGError from "../../error/JGError";
import RandomGen from "../../utils/RandomGen";

const debug = require("debug")("InvokeHandler");

type Handler = (path:Path,buf:Buffer,isJSON:boolean,sender:string,reply_info:AddressInfo)=>Promise<Buffer|Object>;

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


interface HandlerEvent{
    error: (err:Error)=>void;
}

class InvokeHandler implements IHandler{
    public router : IRouter;
    public handler : Handler;
    public lifeCycle = new LifeCycle();

    private eventEmitter = new TypedEmitter<HandlerEvent>();
    private invokers = new LimitedMap<string,Invoker>(500);
    private refs : Map<string,number> = new Map(Object.entries({
        reply:0,
        invokers:0
    }));

    private invokeplug : number;

    constructor(router:IRouter,handler:Handler){
        this.router = router;
        this.handler = handler;

        this.invokeplug = this.router.plug("InvokePacket",this.handlePacket.bind(this));
        
        this.router.getLifeCycle().on("ready",()=>{
            this.lifeCycle.setState("ready");
        });

        this.invokers.on("deleted",(item : Invoker)=>{
            item.close();            
        });

        this.lifeCycle.setState("starting");


    }
    getEventEmitter(){
        return this.eventEmitter;
    }
    async close(){
        if(this.lifeCycle.getState() == "closed")
            return;
        if(this.lifeCycle.getState()  == "starting")
            throw new Error("right now starting")
        
        this.closeAllInvokers();
        
        this.router.unplug("InvokePacket",this.invokeplug);

        this.lifeCycle.setState("closing");
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

        if(this.lifeCycle.getState() == "closing")
            return;
            
        this.setRef("reply",+1);
        let slicer = invoker.slicer as PacketSlicer;
        let sliceids = slicer.getPartSlices();

        try{
            for(let id of sliceids){
                if(this.lifeCycle.getState() != "ready")
                    break;
                    
                await this.router.sendPacket(slicer.getSlicePacket(id),new NetRoute(target.port,target.address));
            }    
        }catch(err){

        }

        this.setRef("reply",-1);
    }

    private async getReplyPacket(invoke_packet:IPacket):Promise<IPacket>{
        let pk = invoke_packet as InvokePacket;

        try{
            let r_pk = new InvokeReplyPacket();

            let ret_data = await this.handler(pk.dst_path,pk.data,pk.isJSON,pk.src_jgname,pk.reply_info);

            if(ret_data instanceof Buffer){
                r_pk.isJSON = false;
                r_pk.data = ret_data;
            }else{
                r_pk.isJSON = true;
                r_pk.data = Buffer.from(JSON.stringify(ret_data as Object));
            }
                    
            r_pk.request_id = pk.request_id;
            return r_pk;
        }catch(err){
            let err_pk = new ErrorPacket();
            err_pk.request_id = pk.request_id;

            if(err instanceof JGError){
                if(err.hasPayloadError()){
                    err_pk.error = err.getPayloadError()
                }else{
                    let payload = new Error();
                    payload.message = err.getShortMessage();
                    payload.name = err.getName();
                    err_pk.error = payload;                    
                }

            }else{
                err_pk.error = err;    
            }
            return err_pk;

        }
    }
    private async addNewInvoker(invoke_pk:IPacket) : Promise<Invoker>{
        this.setRef("invokers",+1);

        let build_req =RandomGen.GetRandomHash(8) + "-build";


        let invoker = new Invoker();
        this.invokers.set(invoke_pk.getRequestId(),invoker);

        invoker.build_req = build_req;

        let result = await this.getReplyPacket(invoke_pk);
        let slicer = new PacketSlicer(result as IPacket,build_req);        

        invoker.setSlicer(slicer);


        let refid=this.router.plug(invoker.build_req,async(p:IPacket)=>{
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
            debug("alldone","requestid:",invoke_pk.getRequestId(),"build_req",invoker.build_req);
        });
        


        invoker.setState("invoked");

        debug("invoked, start to reply","requestid:",invoke_pk.getRequestId(),"build_req",invoker.build_req);

        return invoker;
    }    
    public async handlePacket(p:IPacket){
        if(this.lifeCycle.getState() != "ready")
            throw new Error("isn't ready");

        if(this.hasInvoker(p.getRequestId())){
            let invoker = this.getInvoker(p.getRequestId());
            
            if(invoker.getState() == "invoked")
                this.sendInvokeResult(invoker, p.getReplyInfo());

            return;
        }
        
        let invoker = await this.addNewInvoker(p);        

        this.sendInvokeResult(invoker,p.getReplyInfo());
    }
    private setRef(ref_type:string,offset:number){
        let ref = this.refs.get(ref_type) as number;
        this.refs.set(ref_type,ref+offset);

        if(this.lifeCycle.getState() == "closing"){
            let alldone = true;
            for(let key of this.refs.keys()){
                let r = this.refs.get(key) as number;
                if(r > 0)
                    alldone = false;
            }
            if(alldone)
                this.lifeCycle.setState("closed");

            
        }
    }    

}

export default InvokeHandler;
