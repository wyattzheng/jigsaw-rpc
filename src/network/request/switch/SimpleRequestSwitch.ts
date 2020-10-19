import AbstractRequestSwitch = require("./AbstractRequestSwitch");
import IDomainClient = require("../../domain/client/IDomainClient");
import AbstractNetworkClient = require("../../AbstractNetworkClient");
import Packet = require("../../protocol/Packet");

class SimpleRequestSwitch extends AbstractRequestSwitch{
    private domclient : IDomainClient;
    constructor(client : AbstractNetworkClient,domainclient : IDomainClient){
        super(client);

        this.domclient = domainclient;
    }
    async sendPacket(jgname:string,p : Packet){
        let client = this.getClient();
        let address = await this.domclient.resolve(jgname);
        return address;
    }

}


export = SimpleRequestSwitch;