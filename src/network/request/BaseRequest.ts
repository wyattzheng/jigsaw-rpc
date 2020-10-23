import AbstractRequest = require("./AbstractRequest")
import RequestState = require("./RequestState");
import AbstractNetworkClient = require("../AbstractNetworkClient");
import AbstractPacketRouter = require("./packetrouter/AbstractPacketRouter");
import Packet = require("../protocol/Packet");
import Defer = require("../../utils/Defer");
import SwitchRule = require("./packetrouter/subrouter/RouterRule");
import ErrorPacket = require("../protocol/packet/ErrorPacket");
import util = require("util");
const sleep = util.promisify(setTimeout);


const debug = require("debug")("BaseRequest");

abstract class BaseRequest<T> extends AbstractRequest{
    protected req_seq : number = -1;
    protected result? : T;
    private hasResult : boolean = false;

    protected router : AbstractPacketRouter;
    protected timeout : NodeJS.Timeout;

    private pending_defer? : Defer<void>;
    protected resender_defer? : Defer<void>;
    protected resender_loop : boolean  = false;

    constructor(router: AbstractPacketRouter,seq : number){
        super();

        this.router = router;
        this.req_seq = seq;
        this.timeout=setTimeout(()=>{
            if(this.state == RequestState.BUILDING || this.state == RequestState.BUILT)
                this.setState(RequestState.FAILED);
            else
               this.pending_defer?.reject(new Error("request timeout"));
               
           },10*1000);

        this.once("done",(err)=>{
            clearTimeout(this.timeout);
        });

    }
    private handleErrorPacket(p : Packet){
        if(this.state!=RequestState.PENDING){
            return;
        }

        let pk = p as ErrorPacket;
        this.pending_defer?.reject(pk.error)
    }
    private checkRequestKey(){
        if(this.req_seq < 0)
            throw new Error("request key must be set.")
    }
    setRequestSeq(seq : number){
        this.req_seq = seq;
    }
    getRequestId() : string{
        return this.router.getClient().getClientId() + ":" +this.getName() + ":" + this.req_seq;
    }
    protected setResult(result : T){
        if(this.state!=RequestState.PENDING)
            throw new Error("this result isn't pending,can not set result");
        if(this.hasResult)
            return;
//            throw new Error("already has result");

        this.result = result;
        this.hasResult = true;
        this.pending_defer?.resolve();
    }
    public getResult() : T{
        if(!this.hasResult)
            throw new Error("this result isn't done");

        return this.result as T;
    }
    private async before_wait(){
        if(this.state!=RequestState.BUILT)
            throw new Error("at this state,can not before_run")
        
        this.pending_defer = new Defer();
        this.setState(RequestState.PENDING);
    
        let tick : number = 0;
        this.resender_loop = true;
        this.resender_defer = new Defer();

        while(this.resender_loop){
            if(tick++ % 50 == 0)
                await this.dosend();
            await sleep(1);
        }
        this.resender_defer?.resolve();
    }
    private async after_wait(refid:number,error_refid:number,err:Error | undefined){
        if(this.state!=RequestState.PENDING)
            throw new Error("at this state,can not after_end");

        this.resender_loop = false;
        await this.resender_defer?.promise;

        this.router.unplug(this.getRequestId(),refid);
        this.router.unplug("ErrorPacket",error_refid);
        debug("unplug",refid);
        if(err)
            this.setState(RequestState.FAILED);
        else
            this.setState(RequestState.DONE);
        

    }
    private async dosend(){
            try{
                await this.send()
            }catch(err){
                this.pending_defer?.reject(err);
            };
        

    }
	async run(){

        this.checkRequestKey();

        if(this.state == RequestState.PENDING)
            throw new Error("right now this request is pending")
		if(this.state != RequestState.BUILT)
            throw new Error("this request can not run because of it hasn't been built.");

        
        let refid = this.router.plug(this.getRequestId(),this.handlePacket.bind(this));
        let error_refid = this.router.plug("ErrorPacket",this.handleErrorPacket.bind(this));
    
        debug("plug",refid);

        this.before_wait();
	    this.dosend();
    
        let error : Error | undefined;
        try{
            await (this.pending_defer as Defer<void>).promise;        
        }catch(err){
            error = err;
        }

        this.after_wait(refid,error_refid,error);

        if(error)
            throw error;
            
        return this.getResult();
    }
    protected abstract handlePacket(p:Packet) : void;
    protected abstract async send() : Promise<void>;
}

export = BaseRequest