import AbstractPacketRouter from "./AbstractPacketRouter";
import INetworkClient from "../../client/INetworkClient";
import Packet from "../../protocol/Packet";
import IRoute from "../route/IRoute";

class SimplePacketRouter extends AbstractPacketRouter{
    constructor(client : INetworkClient){
        super(client);
        
    }
    
    async sendPacket(pk : Packet,route:IRoute){
        let addrinfo = await route.getAddressInfo();
        
        await this.client.sendPacket(pk,addrinfo.port,addrinfo.address);
    }

}

export default SimplePacketRouter;