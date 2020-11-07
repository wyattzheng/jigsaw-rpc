import Packet from "../protocol/Packet";
import IRouter from "../router/IRouter";

abstract class AbstractHandler{
    protected router : IRouter;

    constructor(router:IRouter){
        this.router = router;
    }
    protected abstract handlePacket(pk : Packet):void;
}

export default AbstractHandler;
