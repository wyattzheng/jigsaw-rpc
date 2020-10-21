import AbstractRequest = require("./AbstractRequest")
import RequestState = require("./RequestState");
import AbstractNetworkClient = require("../AbstractNetworkClient");
import AbstractPacketRouter = require("./packetrouter/AbstractPacketRouter");
import Packet = require("../protocol/Packet");
import Defer = require("../../utils/Defer");
import SwitchRule = require("./packetrouter/subrouter/RouterRule");
import ErrorPacket = require("../protocol/packet/ErrorPacket");
const debug = require("debug")("BaseRequest");

abstract class BaseRequest<T> extends AbstractRequest{
    protected req_seq : number = -1;
    protected result? : T;
    protected router : AbstractPacketRouter;
    protected resender? : NodeJS.Timeout;
    private pending_defer? : Defer<void>;

    constructor(router: AbstractPacketRouter,seq : number){
        super();
        this.router = router;
        this.req_seq = seq;

        this.router.plug("ErrorPacket",this.handleErrorPacket.bind(this));
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
    private startResend(){
        if(this.state!=RequestState.PENDING)
            throw new Error("at this state,can not startResend")
        
        this.resender = setInterval(()=>{
            this.dosend()
        },50);
    }
    private endResend(){
        if(this.state!=RequestState.DONE && this.state!=RequestState.FAILED)
            throw new Error("at this state,can not endResend");

        clearInterval(this.resender as NodeJS.Timeout);
    }
    private dosend(){
        try{
            this.send();
        }catch(err){
            this.pending_defer?.reject(err);
        }
    }
	async run(){

        this.checkRequestKey();

		if(this.state != RequestState.BUILT)
            throw new Error("this request can not run because of it hasn't been built.");

        
        let refid = this.router.plug(this.getRequestId(),this.handlePacket.bind(this));
    
        debug("plug",refid);
        this.pending_defer = new Defer();

        this.setState(RequestState.PENDING);

        let timeout=setTimeout(()=>{
            this.pending_defer?.reject(new Error("request timeout"));
        },10*1000);

        this.dosend()
        this.startResend();

        try{
            await this.pending_defer.promise; 
            this.setState(RequestState.DONE);
            return this.getResult();
        }catch(err){
            this.setState(RequestState.FAILED);
            console.error(err);
            throw err;
        }finally{
            clearTimeout(timeout);
            this.endResend();
            this.router.unplug(this.getRequestId(),refid);
            debug("unplug",refid);
        }
        
    }
    protected abstract handlePacket(p:Packet) : void;
    protected abstract send() : void;
}

export = BaseRequest