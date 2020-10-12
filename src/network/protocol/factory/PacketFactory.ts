import Packet = require("./Packet");
import BasePacket = require("./BasePacket");
import IFactory = require("./IFactory");

type PacketCls = {new():Packet};

class PacketFactory implements IFactory<Buffer,Packet>{

	constructor(){
		this.register(require("./packet/TestPacket"));
	}
	private register(cls : PacketCls) : void{
		let c=new cls();
		let pkid=(c.constructor as any).packet_id;
		this.packets.set(pkid,cls);
	}
	private getProductCls(packetid : number) : PacketCls{
		let cls = this.packets.get(packetid);
		if(cls == undefined)
			throw new Error(`this packetid ${packetid} not point to a packet`);

		return cls;
	}
	private getPacketId(buf : Buffer):number{
		let pk = new BasePacket();
		pk.decode(buf);	
		let pid = pk.getPacketId();
		return pid;

	}
	public getProduct(buf : Buffer) : Packet{

		let pid = this.getPacketId(buf);
		let Cls : PacketCls = this.getPacketCls(pid);

		let ins=new Cls();
		return ins;
	}

}

export = PacketFactory;
