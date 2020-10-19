import AbstractPacketRouter =  require("./AbstractPacketRouter");
import AbstractNetworkClient = require("../../AbstractNetworkClient");
import Packet = require("../../protocol/Packet");

class NetPacketRouter extends AbstractPacketRouter{
    private dst_address : string;
    private dst_port : number;
    constructor(client : AbstractNetworkClient,dst_port?:number,dst_address?:string){
        super(client);
        this.dst_port = dst_port || -1;
        this.dst_address = dst_address || "Not a valid address";
    }
    sendPacket(p : Packet,dst_port?:number,dst_address?:string) : void{
        let client = this.getClient();
        
        client.sendPacket(p,dst_port || this.dst_port, dst_address || this.dst_address);
    }
}

export = NetPacketRouter;
