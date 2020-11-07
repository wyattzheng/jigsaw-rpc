import ISocket from "../socket/ISocket";
import BaseNetworkClient from "./BaseNetworkClient";
import IBuilderManager from "../protocol/builder/manager/IBuilderManager";
import IFactory from "../protocol/factory/IFactory";
import IPacket from "../protocol/IPacket";
import SlicePacket from "../protocol/packet/SlicePacket";
import SliceHandler from "../handler/SliceHandler";
import SimplePacketRouter from "../router/packetrouter/SimplePacketRouter";

class BuilderNetworkClient extends BaseNetworkClient{
    private slice_handler : SliceHandler;

    constructor(socket : ISocket, factory : IFactory<Buffer,IPacket>, builder_manager : IBuilderManager<SlicePacket,IPacket>){
        super(socket,factory);
       
        this.slice_handler = new SliceHandler(new SimplePacketRouter(this),builder_manager);

        this.slice_handler.setHandler(this.handlePacket.bind(this));
    }
    protected handlePacket(pk : IPacket){
        this.getEventEmitter().emit("packet",pk);
    }
    
}

export default BuilderNetworkClient;
