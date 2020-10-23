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
    protected router : AbstractPacketRouter;
    protected timeout : NodeJS.Timeout;
    private pending_defer? : Defer<void>;

    protected resender? : Defer<void>;
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
        })

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
        this.result = result;
        this.pending_defer?.resolve();
    }
    public getResult() : T{
        if(this.state!=RequestState.DONE)
            throw new Error("this result isn't done");

        return this.result as T;
    }
    private async startResend(){
        if(this.state!=RequestState.PENDING)
            throw new Error("at this state,can not startResend")
        

        let tick : number = 0;
        this.resender_loop = true;
        this.resender = new Defer();

        while(this.resender_loop){
            if(tick++ % 50 == 0)
                await this.dosend();
            await sleep(1);
        }
        this.resender?.resolve();
    }
    private async endResend(){
        if(this.state!=RequestState.PENDING)
            throw new Error("at this state,can not endResend");

        this.resender_loop = false;
        await this.resender?.promise;
        
    }
    private async dosend(){
        
        try{
            await this.send();
        }catch(err){
            this.pending_defer?.reject(err);
        }
    }
	async run(){

        this.checkRequestKey();

        if(this.state == RequestState.PENDING)
            throw new Error("right now this request is pending")
		if(this.state != RequestState.BUILT)
            throw new Error("this request can not run because of it hasn't been built.");

        
        this.pending_defer = new Defer();

        this.setState(RequestState.PENDING);

        let refid = this.router.plug(this.getRequestId(),this.handlePacket.bind(this));
        let error_refid = this.router.plug("ErrorPacket",this.handleErrorPacket.bind(this));
    
        debug("plug",refid);

        await this.dosend();
        this.startResend();

        let error;
        try{
            await this.pending_defer.promise;        
        }catch(err){
            error = err;
        }

        await this.endResend();
        this.router.unplug(this.getRequestId(),refid);
        this.router.unplug("ErrorPacket",error_refid);
        debug("unplug",refid);

        if(error)
            this.setState(RequestState.FAILED);
        else
            this.setState(RequestState.DONE);
        
    }
    protected abstract handlePacket(p:Packet) : void;
    protected abstract async send() : Promise<void>;
}

export = BaseRequest