import AbstractSocket = require("./socket/AbstractSocket");
import BaseNetworkClient = require("./BaseNetworkClient");
import IBuilderManager = require("./protocol/builder/manager/IBuilderManager");
import PacketBuilderManager = require("./protocol/builder/manager/PacketBuilderManager");
import IFactory = require("./protocol/factory/IFactory");
import Packet = require("./protocol/Packet");
import SlicePacket = require("./protocol/packet/SlicePacket");

class BuilderNetworkClient extends BaseNetworkClient{
    private slice_builder_manager : IBuilderManager<SlicePacket,Packet>;
    constructor(socket : AbstractSocket, builder_manager : IBuilderManager<SlicePacket,Packet>, factory : IFactory<Buffer,Packet>){
        super(socket,builder_manager,factory);

        this.slice_builder_manager=builder_manager;

    }
    protected handlePacket(pk : Packet){
        if(pk.getName() == "SlicePacket"){
            let spk = pk as SlicePacket;
            let manager = this.slice_builder_manager;
            
            if(!manager.hasBuilder(spk.buildkey))
                manager.createBuilder(spk.buildkey,spk.partmax);

            
            manager.addPart(spk.buildkey,spk);
            
            if(manager.isDone(spk.buildkey)){
                let built=manager.getBuilt(spk.buildkey);
                built.decode();
                this.emit("packet",built);
            }
        
        }else
            this.emit("packet",pk);
    }
    
}

export = BuilderNetworkClient;
