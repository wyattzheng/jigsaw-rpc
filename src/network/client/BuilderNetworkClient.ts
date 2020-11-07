import AbstractSocket from "../socket/AbstractSocket";
import BaseNetworkClient from "./BaseNetworkClient";
import IBuilderManager from "../protocol/builder/manager/IBuilderManager";
import PacketBuilderManager from "../protocol/builder/manager/PacketBuilderManager";
import IFactory from "../protocol/factory/IFactory";
import Packet from "../protocol/Packet";
import SlicePacket from "../protocol/packet/SlicePacket";
import SliceHandler from "../handler/SliceHandler";
import SimplePacketRouter from "../router/packetrouter/SimplePacketRouter";

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

export default BuilderNetworkClient;
