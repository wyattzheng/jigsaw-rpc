import AbstractRouter from "./AbstractRouter";
import Packet = require("../protocol/Packet");
const debug = require("debug")("PacketTypeRouter");

class PacketTypeRouter extends AbstractRouter{
    constructor(){
        super();

    }
    sendPacket(){
        throw new Error("this router can not sendPacket");
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
