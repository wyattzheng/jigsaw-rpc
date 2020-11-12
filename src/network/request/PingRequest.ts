import BaseRequest from "./BaseRequest";
import AddressInfo from "../domain/AddressInfo";
import Packet from "../protocol/Packet";
import IRouter from "../router/IRouter";
import NetRoute from "../router/route/NetRoute";
import PingPacket from "../protocol/packet/PingPacket";
import PongPacket from "../protocol/packet/PongPacket";

class PingRequest extends BaseRequest<void>{
    private dst : AddressInfo ;
    constructor(dst:AddressInfo,router : IRouter,seq_id : number){
        super(router,seq_id,5*1000); //5s timeout

        this.dst = dst;
        this.getLifeCycle().setState("ready");
    }
    async send(){
        let pk=new PingPacket();

        pk.request_id = this.getRequestId();

        this.router.sendPacket(pk,new NetRoute(this.dst.port,this.dst.address));

    }
    getName(){
        return "PingRequest";
    }
    handlePacket(p : Packet){

        if(p.getName() == "PongPacket"){
            let pk = p as PongPacket;
            this.setResult();
            
        }else
            throw new Error("recv an unknown packet");
    }
}

export default PingRequest