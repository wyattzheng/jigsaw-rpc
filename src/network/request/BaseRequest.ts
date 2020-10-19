import AbstractRequest = require("./AbstractRequest")
import RequestState = require("./RequestState");
import AbstractNetworkClient = require("../AbstractNetworkClient");
import RequestSwitch = require("./switch/AbstractRequestSwitch");
import Packet = require("../protocol/Packet");
import Defer = require("../../utils/Defer");
import SwitchRule = require("./switch/SwitchRule");

abstract class BaseRequest<T> extends AbstractRequest{
    protected req_seq : number = -1;
    protected result? : T;
    protected rswitch : RequestSwitch;
    protected resender? : NodeJS.Timeout;
    private pending_defer? : Defer<void>;

    constructor(rswitch: RequestSwitch){
        super();
        this.rswitch = rswitch;
    }
    private checkRequestKey(){
        if(this.req_seq < 0)
            throw new Error("request key must be set.")
    }
    setRequestSeq(seq : number){
        this.req_seq = seq;
    }
    getRequestId() : string{
        return this.rswitch.getClient().getClientId() + ":" + this.req_seq;
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
            this.send();
        },50);
    }
    private endResend(){
        if(this.state!=RequestState.DONE && this.state!=RequestState.FAILED)
            throw new Error("at this state,can not endResend");

        clearInterval(this.resender as NodeJS.Timeout);
    }
	async run(){

        this.checkRequestKey();

		if(this.state != RequestState.BUILT)
            throw new Error("this request can not run because of it hasn't been built.");

        let refid = this.rswitch.plug(this.getRequestId(),SwitchRule.RequestId,this.handlePacket.bind(this));

        this.pending_defer = new Defer();

        this.setState(RequestState.PENDING);

        let timeout=setTimeout(()=>{
            this.pending_defer?.reject(new Error("request timeout"));
        },10*1000);

        this.send();
        this.startResend();

        try{
            await this.pending_defer.promise; 
            this.setState(RequestState.DONE);
            return this.getResult();
        }catch(err){
            this.setState(RequestState.FAILED);
            throw err;
        }finally{
            clearTimeout(timeout);
            this.endResend();
            this.rswitch.unplug(this.getRequestId(),refid);            
        }
        
    }
    protected abstract handlePacket(p:Packet) : void;
    protected abstract send() : void;
}

export = BaseRequest