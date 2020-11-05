import AbstractSocket = require("./socket/AbstractSocket");
import BaseNetworkClient = require("./BaseNetworkClient");
import IBuilderManager = require("./protocol/builder/manager/IBuilderManager");
import PacketBuilderManager = require("./protocol/builder/manager/PacketBuilderManager");
import IFactory = require("./protocol/factory/IFactory");
import Packet = require("./protocol/Packet");
import SlicePacket = require("./protocol/packet/SlicePacket");
import SliceHandler = require("./handler/SliceHandler");
import SimplePacketRouter = require("./router/packetrouter/SimplePacketRouter");

class BuilderNetworkClient extends BaseNetworkClient{
    private slice_handler : SliceHandler;

    constructor(socket : AbstractSocket, factory : IFactory<Buffer,Packet>, builder_manager : IBuilderManager<SlicePacket,Packet>){
        super(socket,factory);
       
        this.slice_handler = new SliceHandler(new SimplePacketRouter(this),builder_manager);

        this.slice_handler.setHandler(this.handlePacket.bind(this));
    }
    protected handlePacket(pk : Packet){

            this.getEventEmitter().emit("packet",pk);
    }
    
}

export = BuilderNetworkClient;
