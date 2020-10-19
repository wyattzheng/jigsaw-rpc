import AbstractRouter from "./AbstractRouter";
import Packet = require("../../../protocol/Packet");
import RouterRule = require("./RouterRule");
import HandlerRef = require("./HandlerRef");

class PacketTypeRouter extends AbstractRouter{
    constructor(){
        super();

    }
    getRule(){
        return RouterRule.PacketType;
    }
    handlePacket(pk:Packet){
        let handlers = this.getHandlers(pk.getName());
        let keys = Array.from(handlers.keys());

        for(let key of keys){
            let handlerRef = handlers.get(key) as HandlerRef;
            handlerRef.handler(pk);
        }

    }

}

export = PacketTypeRouter;
