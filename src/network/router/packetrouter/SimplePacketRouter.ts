import AbstractPacketRouter = require("./AbstractPacketRouter");
import IDomainClient = require("../../domain/client/IDomainClient");
import AbstractNetworkClient = require("../../AbstractNetworkClient");
import Packet = require("../../protocol/Packet");
import IRoute = require("../route/IRoute");

class SimplePacketRouter extends AbstractPacketRouter{
    constructor(client : AbstractNetworkClient){
        super(client);
        
    }
    
    async sendPacket(pk : Packet,route:IRoute){
        let addrinfo = await route.getAddressInfo();
        this.client.sendPacket(pk,addrinfo.port,addrinfo.address);
    }

}

export = SimplePacketRouter;