import AbstractRouter from "./AbstractRouter";
import Packet = require("../../../protocol/Packet");
import RouterRule = require("./RouterRule");
import HandlerRef = require("./HandlerRef");
const debug = require("debug")("RequestIdRouter");

class RequestIdRouter extends AbstractRouter{
    constructor(){
        super();

    }
    getRule(){
        return RouterRule.RequestId;
    }

    handlePacket(pk:Packet){
        if(!this.hasHandlers(pk.request_id))
            return;

        let handlers=this.getHandlers(pk.request_id);
        
        try{
            for (let i in handlers)
                handlers[i].data(pk);
        }catch(err){
            debug(err);
        }

    }

}

export = RequestIdRouter;
