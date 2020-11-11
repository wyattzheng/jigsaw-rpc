import IPacket from "../IPacket";
import BasePacket from "../BasePacket";
import IFactory from "./IFactory";

type PacketCls = new (...args:any[]) => IPacket;

class PacketFactory implements IFactory<Buffer,IPacket>{
	public classes = new Map<number,{ new():IPacket }>();

	constructor(){
		this.register(require("../packet/TestPacket").default);
		this.register(require("../packet/SlicePacket").default);
		this.register(require("../packet/InvokePacket").default);
		this.register(require("../packet/DomainQueryPacket").default);
		this.register(require("../packet/DomainReplyPacket").default);
		this.register(require("../packet/DomainUpdatePacket").default);
		this.register(require("../packet/ErrorPacket").default);
		this.register(require("../packet/InvokeReplyPacket").default);
		this.register(require("../packet/SliceAckPacket").default);
		
		
	}
	public register(cls : PacketCls) : void{
		let c=new cls();
		let pkid=(c.constructor as any).packet_id;
		this.classes.set(pkid,cls);
	}
	public getProductCls(packetid : number) : PacketCls{
		let cls = this.classes.get(packetid);
		if(cls == undefined)
			throw new Error(`this packetid ${packetid} not point to a packet`);

		return cls;
	}
	private getPacketId(buf : Buffer):number{
		let pk = new BasePacket();
		pk.setBuffer(buf)
		pk.decode();	
		let pid = pk.getPacketId();
		return pid;

	}
	public getProduct(buf : Buffer) : IPacket{

		let pid = this.getPacketId(buf);
		let Cls : PacketCls = this.getProductCls(pid);

		let ins=new Cls();
		return ins;
	}

}

export default PacketFactory;
