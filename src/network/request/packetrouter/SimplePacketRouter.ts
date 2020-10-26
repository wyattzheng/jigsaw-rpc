import AbstractPacketRouter = require("./AbstractPacketRouter");
import IDomainClient = require("../../domain/client/IDomainClient");
import AbstractNetworkClient = require("../../AbstractNetworkClient");
import Packet = require("../../protocol/Packet");

class SimplePacketRouter extends AbstractPacketRouter{
    private domclient : IDomainClient;
    constructor(client : AbstractNetworkClient,domainclient : IDomainClient){
        super(client);

        this.domclient = domainclient;
    }
    public preload(jgname:string){
        return this.domclient.resolve(jgname);
    }

    async sendPacket(jgname:string,p : Packet){
        let address = await this.domclient.resolve(jgname);
       
        let client=this.getClient();
        client.sendPacket(p,address.port,address.address);

    }

}

export = SimplePacketRouter;