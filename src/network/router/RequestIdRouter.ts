import AbstractRouter from "./AbstractRouter";
import Packet from "../protocol/Packet";
import PacketParsingError from "../../error/PacketParsingError";
const debug = require("debug")("RequestIdRouter");

class RequestIdRouter extends AbstractRouter{
    constructor(){
        super();

    }
    async sendPacket(){
        throw new PacketParsingError("this router can not sendPacket");
    }
    async handlePacket(pk:Packet){
        if(!this.hasHandlers(pk.request_id))
            return;

        let handlers=this.getHandlers(pk.request_id);
        
        try{
            for (let i in handlers)
                await handlers[i].data(pk);
        }catch(err){
            debug(err);
        }

    }
    async close():Promise<void>{

    }

}

export default RequestIdRouter;
