import AbstractPacketRouter = require("../request/packetrouter/AbstractPacketRouter");
import Packet = require("../protocol/Packet");

abstract class AbstractHandler{
    protected router : AbstractPacketRouter;

    constructor(router:AbstractPacketRouter){
        this.router = router;
    }
    protected abstract handlePacket(pk : Packet):void;
}

export = AbstractHandler;
