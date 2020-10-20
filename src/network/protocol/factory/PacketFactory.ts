import Packet = require("../Packet");
import BasePacket = require("../BasePacket");
import IFactory = require("./IFactory");

type PacketCls = {new():Packet};

class PacketFactory implements IFactory<Buffer,Packet>{
	public classes = new Map<number,{ new():Packet }>();

	constructor(){
		this.register(require("../packet/TestPacket"));
		this.register(require("../packet/SlicePacket"));
		this.register(require("../packet/InvokePacket"));
		this.register(require("../packet/DomainQueryPacket"));
		this.register(require("../packet/DomainReplyPacket"));
		this.register(require("../packet/DomainUpdatePacket"));
		this.register(require("../packet/ErrorPacket"));
		this.register(require("../packet/InvokeReplyPacket"));
		
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
	public getProduct(buf : Buffer) : Packet{

		let pid = this.getPacketId(buf);
		let Cls : PacketCls = this.getProductCls(pid);

		let ins=new Cls();
		return ins;
	}

}

export = PacketFactory;
