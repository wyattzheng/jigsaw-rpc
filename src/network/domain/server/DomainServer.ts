import BuilderNetworkClient = require("../../BuilderNetworkClient");
import UDPSocket = require("../../socket/UDPSocket");
import PacketBuilderManager = require("../../protocol/builder/manager/PacketBuilderManager");
import PacketFactory = require("../../protocol/factory/PacketFactory");
import NetRequestSwitch = require("../../request/packetrouter/NetPacketRouter");
import Packet = require("../../protocol/Packet");
import DomainQueryPacket = require("../../protocol/packet/DomainQueryPacket");
import DomainStorage = require("./DomainStorage");
import DomainReplyPacket = require("../../protocol/packet/DomainReplyPacket");

class DomainServer{
    private address:string;
    private port:number;
    private rswitch:NetRequestSwitch;
    private client : BuilderNetworkClient;
    private socket : UDPSocket;
    private storage : DomainStorage;

    constructor(rswitch:NetRequestSwitch,bind_address:string,bind_port:number){
        this.address = bind_address;
        this.port = bind_port;

        this.storage = new DomainStorage();

        let factory = new PacketFactory();
        let builder_manager = new PacketBuilderManager(factory);

        this.socket = new UDPSocket(this.port,this.address);
        this.client = new BuilderNetworkClient(this.socket,builder_manager,factory);
        
        this.rswitch = new NetRequestSwitch(this.client,"No a valid destination",-1); //readonly

        this.rswitch.plug("DomainQueryPacket",this.handleQueryPacket.bind(this));
    }
    private handleQueryPacket(p : Packet):void{
        let pk = p as DomainQueryPacket;

        let r_pk = new DomainReplyPacket();
        let addr = this.storage.getAddress(pk.jgname);
        r_pk.address = addr.address;
        r_pk.port = addr.port;
        
        this.rswitch.sendPacket(r_pk,r_pk.reply_info.port,r_pk.reply_info.address);
    }

}

export = DomainServer;