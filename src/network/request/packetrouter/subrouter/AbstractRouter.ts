import RouterRule = require("./RouterRule");
import Packet = require("../../../protocol/Packet");
import AbstractNetworkClient = require("../../../AbstractNetworkClient");
import IRouter = require("./IRouter");
import HandlerRef = require("./HandlerRef");

import assert = require("assert");

type Handler = (pk:Packet)=>void;

abstract class AbstractRouter implements IRouter{
    public static rule : RouterRule;
    private refid : number = 0;
    private refs : number = 0; 
    
    private handlers: Map<string,Map<number,HandlerRef>> = new Map();


    public abstract getRule():RouterRule;

    public abstract handlePacket(pk : Packet) : void;
    public hasHandlers(sign : string){
        return this.handlers.has(sign);
    }
    public getHandlers(sign :string) : Map<number,HandlerRef>{
        if(!this.hasHandlers(sign))
            throw new Error('can not get this handlers');
        
        let handlers = this.handlers.get(sign);
        assert(handlers,"handlers must be an array");
        
        return handlers;
    }
    public plug(sign:string,handler:Handler){
        let refid=this.refid++;
        
        if(!this.hasHandlers(sign))
            this.handlers.set(sign,new Map());

        let handlers = this.getHandlers(sign);

        handlers.set(refid,new HandlerRef(sign,handler));

        return refid;
    }
    public unplug(sign:string,refid:number){
        let handlers = this.getHandlers(sign);
        if(!handlers.has(refid))
            console.error("unplug failed, this handler doesn't exists",refid,handlers);

        handlers.delete(refid);
    }

}

export = AbstractRouter;