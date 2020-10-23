import AbstractRouter from "./AbstractRouter";
import Packet = require("../../../protocol/Packet");
import RouterRule = require("./RouterRule");
import HandlerRef = require("./HandlerRef");
const debug = require("debug")("PacketTypeRouter");

class PacketTypeRouter extends AbstractRouter{
    constructor(){
        super();

    }
    getRule(){
        return RouterRule.PacketType;
    }
    handlePacket(pk:Packet){

        if(!this.hasHandlers(pk.getName()))
            return;

        let handlers=this.getHandlers(pk.getName());
        try{
            for (let i in handlers)
                handlers[i].data(pk);
        }catch(err){
            debug(err);
        }

    }

}

export = PacketTypeRouter;
