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
import util from "util";


const sleep = util.promisify(setTimeout)
const debug = require("debug")("InvokeHandler");

type Handler = (path:Path,buf:Buffer,isJSON:boolean,sender:string)=>Promise<Buffer|object>;

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

class InvokeHandler implements IHandler{
    public router : IRouter;
    public handler : Handler;
    public state : string = "starting";
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
            this.state = "ready";
        });
        this.router.getLifeCycle().on("closed",()=>{
            this.close();
        });

        this.invokers.on("deleted",(item : Invoker)=>{
            item.close();
            
        })

    }
    async close(){
        if(this.state == "close")
            return;
        if(this.state == "starting")
            throw new Error("right now starting")
        
        this.closeAllInvokers();
        
        this.router.unplug("InvokePacket",this.invokeplug);

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

    private async getReplyPacket(invoke_packet:IPacket):Promise<IPacket>{
        let pk = invoke_packet as InvokePacket;

        try{
            let r_pk = new InvokeReplyPacket();

            let ret_data = await this.handler(pk.dst_path,pk.data,pk.isJSON,pk.src_jgname);

            if(ret_data instanceof Buffer){
                r_pk.isJSON = false;
                r_pk.data = ret_data;
            }else{
                r_pk.isJSON = true;
                r_pk.data = Buffer.from(JSON.stringify(ret_data as object));
            }
                    
            r_pk.request_id = pk.request_id;
            return r_pk;
        }catch(err){
            let err_pk = new ErrorPacket();
            err_pk.request_id = pk.request_id;
            err_pk.error = err;

            return err_pk;
        }
    }
    private async addNewInvoker(invoke_pk:IPacket) : Promise<Invoker>{
        this.setRef("invokers",+1);

        let build_req =Math.random() + "-build";


        let invoker = new Invoker();
        this.invokers.set(invoke_pk.getRequestId(),invoker);

        invoker.build_req = build_req;

        let result = await this.getReplyPacket(invoke_pk);
        let slicer = new PacketSlicer(result as IPacket,build_req);        

        invoker.setSlicer(slicer);


        let refid=this.router.plug(invoker.build_req,(p:IPacket)=>{
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
        if(this.state != "ready")
            return;

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
