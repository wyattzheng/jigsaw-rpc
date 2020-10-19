import AbstractNetworkClient from "../../AbstractNetworkClient";
import Packet = require("../../protocol/Packet");
import assert = require("assert");
import SwitchRule = require("./SwitchRule");

class HandlerRef {
    public rule : SwitchRule;
    public sign: string;
    public handler : (p:Packet)=>void;
    constructor(sign:string,rule:SwitchRule,handler:(p:Packet)=>void){
        this.sign=sign;
        this.rule=rule;
        this.handler=handler;
    }
}

abstract class AbstractRequestSwitch{

    private client : AbstractNetworkClient;
    private refid : number = 0;
    private refs : number = 0; 
    private handlers_map : Map<string,Map<number,HandlerRef>> ;

    constructor(client: AbstractNetworkClient){
        this.client = client;
        this.handlers_map = new Map();

        this.client.on("packet",this.onClientPacket.bind(this));
    }
    private onClientPacket(p : Packet){
        let handlers=this.getHandlers(p.request_id);
        let keys = Array.from(handlers.keys());

        for(let key of keys){
            let handlerRef = handlers.get(key) as HandlerRef;
            handlerRef.handler(p);
        }        

    }
    private hasHandlers(reqid : string){
        return this.handlers_map.has(reqid);
    }
    private getHandlers(reqid :string) : Map<number,HandlerRef>{
        if(!this.hasHandlers(reqid))
            throw new Error('can not get this handlers');
        
        let handlers = this.handlers_map.get(reqid);
        assert(handlers,"handlers must be an array");
        
        return handlers;
    }
    public getClient() : AbstractNetworkClient{
        return this.client;
    }
    plug( sign:string,rule:SwitchRule,handler:(p:Packet)=>void ){
        
        let refid=this.refid++;
        
        if(!this.hasHandlers(sign))
            this.handlers_map.set(sign,new Map());

        let handlers = this.getHandlers(sign);

        handlers.set(refid,new HandlerRef(sign,rule,handler));

        return this.refid;
    }
    unplug(sign:string , refid:number){
        let handlers = this.getHandlers(sign);
        handlers.delete(refid);
    }

}

export = AbstractRequestSwitch;