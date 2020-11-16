import AddressInfo from "../domain/AddressInfo";
import IPacket from "./IPacket";

abstract class Packet implements IPacket{ // Design Mode : Builder Mode
	public request_id : string = "";
	public reply_info : AddressInfo = new AddressInfo("Not a valid target",-1);

	private static min_buffer_size : number = 3000;
	protected buffer : Buffer;
	protected offset : number = 0;
	protected built : boolean = false;
	protected buffer_sliced : boolean = false

	constructor(){
		this.buffer = Buffer.allocUnsafe( Packet.min_buffer_size );
	}
	isBuilt(){
		return this.built;
	}
	abstract release() : void;
	abstract getName() : string;

	setReplyInfo(reply:AddressInfo){
		this.reply_info = reply;
	}
	getReplyInfo():AddressInfo{
		return this.reply_info;
	}
	setRequestId(reqid:string){
		this.request_id = reqid;
	}
	getRequestId():string{
		return this.request_id;
	}
	getPacketId() : number{
		return (this.constructor as any).packet_id;
	}

	public getSlicedData(check : boolean = true) : Buffer{
//		if(this.offset > Packet.buffer_size && check)
//			throw new Error("this buffer is too large to get")
		

		if(this.buffer.length!=this.offset)
			this.buffer = this.buffer.slice(0,this.offset);

		return this.buffer;	
	}
	public setBuffer(buf : Buffer){
		this.buffer = buf;
	}
	public encode() : void{
		if(this.built){
			throw new Error("this packet has already built");
		}
		this.offset = 0;
		this.built = true;

	}
	public decode() : void{
		if(this.built){
			throw new Error("this packet has already built");
		}

		this.offset = 0;
		this.built = true;
	}


}

export default Packet;
