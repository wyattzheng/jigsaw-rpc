import IPacket from "../protocol/IPacket";
import Defer from "../../utils/Defer";
import ErrorPacket from "../protocol/packet/ErrorPacket";
import util from "util";
import RequestTimeoutError from "../../error/request/RequestTimeoutError";
import RequestRemoteError from "../../error/request/RequestRemoteError";
import IRouter from "../router/IRouter";
import LifeCycle from "../../utils/LifeCycle";
import IRequest from "./IRequest";

const sleep = util.promisify(setTimeout);


const debug = require("debug")("BaseRequest");

abstract class BaseRequest<T> implements IRequest<T>{
    protected req_seq : number = -1;
    protected result? : T;
    protected hasResult : boolean = false;
    protected timeout_duration : number;
    protected router : IRouter;


    private timeout : NodeJS.Timeout;
    private pending_defer? : Defer<void>;
    private resender_defer? : Defer<void>;
    private resender_loop : boolean  = false;
	protected failed_reason? :Error;
	private lifeCycle = new LifeCycle();

    constructor(router: IRouter,seq : number,timeout_duration : number){

        this.router = router;
        this.req_seq = seq;

        this.timeout_duration = timeout_duration;
        this.timeout=setTimeout(()=>{
            if(this.lifeCycle.getState() == "starting" || this.lifeCycle.getState() == "ready"){
                this.lifeCycle.setDead(this.getTimeoutError());
            }else{
               this.pending_defer?.reject(this.getTimeoutError());
            }
           },this.timeout_duration);

        this.lifeCycle.on("closed",()=>{
            clearTimeout(this.timeout);
        });

    }

    protected getTimeoutError(){
        return new RequestTimeoutError(this.timeout_duration);
    }
    protected handleErrorPacket(p : IPacket){
        let pk = p as ErrorPacket;
        throw new RequestRemoteError(pk.error);
    }
    private onErrorPacket(p : IPacket){
        try{
            this.handleErrorPacket(p);
        }catch(err){
            this.pending_defer?.reject(err);
        }
    }
    private checkRequestKey(){
        if(this.req_seq < 0)
            throw new Error("request key must be set.")
    }
    
    setRequestSeq(seq : number){
        this.req_seq = seq;
    }

    getRequestId() : string{
        return this.router.getRouterId() + ":" +this.getName() + ":" + this.req_seq;
    }
    protected setResult(result : T){

        if(this.lifeCycle.getState()!="closing")
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
        if(this.lifeCycle.getState()!="ready")
            throw new Error("at this state,can not before_run")
        
        this.pending_defer = new Defer();
        this.lifeCycle.setState("closing");
    
        let tick : number = 0;
        this.resender_loop = true;
        this.resender_defer = new Defer();

        while(this.resender_loop){
            if(tick++ % 50 == 0){
                await this.dosend();

            }
            await sleep(1);
        }
        this.resender_defer?.resolve();
    }
    private async after_wait(refid:number,error_refid:number,err:Error | undefined){
        if(this.lifeCycle.getState()!="closing")
            throw new Error("at this state,can not after_end");

        this.resender_loop = false;
        await this.resender_defer?.promise;

        this.router.unplug(this.getRequestId(),refid);
        this.router.unplug("ErrorPacket",error_refid);
        debug("unplug",refid);
        
        if(err)
            this.lifeCycle.setDead(err);
        else{
            this.lifeCycle.setState("closed");
        }
        
    }
    private async dosend(){
            try{
                await this.send();
            }catch(err){
                this.pending_defer?.reject(err);
            };
        

    }
	async run(){

        this.checkRequestKey();

        if(this.lifeCycle.getState() == "closing")
            throw new Error("right now this request is pending")
		if(this.lifeCycle.getState() != "ready")
            throw new Error("this request can not run because of it hasn't been built.");

        

        let refid = this.router.plug(this.getRequestId(),this.handlePacket.bind(this));
        let error_refid = this.router.plug("ErrorPacket",this.onErrorPacket.bind(this));
    
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

    getLifeCycle(){
        return this.lifeCycle;
    }
    abstract getName():string;
    protected abstract handlePacket(p:IPacket) : void;
    protected abstract async send() : Promise<void>;
}

export default BaseRequest