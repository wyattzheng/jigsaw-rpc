import Packet = require("../protocol/Packet");
import IRouter = require("../router/IRouter");

abstract class AbstractHandler{
    protected router : IRouter;

    constructor(router:IRouter){
        this.router = router;
    }
    protected abstract handlePacket(pk : Packet):void;
}

export = AbstractHandler;
