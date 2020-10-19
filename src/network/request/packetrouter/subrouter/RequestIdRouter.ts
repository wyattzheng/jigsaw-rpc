import AbstractRouter from "./AbstractRouter";
import Packet = require("../../../protocol/Packet");
import RouterRule = require("./RouterRule");
import HandlerRef = require("./HandlerRef");

class RequestIdRouter extends AbstractRouter{
    constructor(){
        super();

    }
    getRule(){
        return RouterRule.RequestId;
    }

    handlePacket(pk:Packet){
        let handlers = this.getHandlers(pk.request_id);
        let keys = Array.from(handlers.keys());

        for(let key of keys){
            let handlerRef = handlers.get(key) as HandlerRef;
            handlerRef.handler(pk);
        }

    }

}

export = RequestIdRouter;
