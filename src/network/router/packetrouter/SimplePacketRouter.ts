import AbstractPacketRouter from "./AbstractPacketRouter";
import AbstractNetworkClient from "../../client/AbstractNetworkClient";
import Packet from "../../protocol/Packet";
import IRoute from "../route/IRoute";

class SimplePacketRouter extends AbstractPacketRouter{
    constructor(client : AbstractNetworkClient){
        super(client);
        
    }
    
    async sendPacket(pk : Packet,route:IRoute){
        let addrinfo = await route.getAddressInfo();
        this.client.sendPacket(pk,addrinfo.port,addrinfo.address);
    }

}

export default SimplePacketRouter;