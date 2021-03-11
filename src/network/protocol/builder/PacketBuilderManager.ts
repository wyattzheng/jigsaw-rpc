import AbstractBuilderManager from "./AbstractBuilderManager";
import IPacket from "../IPacket";
import IBuilder from "./IBuilder";
import PacketBuilder from "./PacketBuilder";
import SlicePacket from "../packet/SlicePacket";
import IFactory from "../factory/IFactory";

class PacketBuilderManager extends AbstractBuilderManager<SlicePacket,IPacket>{
	protected factory : IFactory<Buffer,IPacket>;
	constructor(factory : IFactory<Buffer,IPacket>){
		super();
		this.factory = factory;
	}
	getNewBuilder(maxslices : number) : IBuilder<SlicePacket,IPacket>{
		return new PacketBuilder(maxslices,this.factory);
	}

}

export default PacketBuilderManager;