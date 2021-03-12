import CommonError from "../../../error/CommonError";
import BasePacket from "../BasePacket";

class TestPacket extends BasePacket{
	public static packet_id : number = 1;
	public testdata : Array<Buffer> = [];

	constructor(){
		super();

	}
	getName() : string{
		return "TestPacket";
	}
	public encode() : void{
		if(this.built)return;

		if(this.testdata.length>100)
			throw new CommonError("this array too large")

		super.encode.call(this);
		for(let data of this.testdata)
			this.writeBuffer(data);
		this.writeBuffer(Buffer.allocUnsafe(0));
	}
	public decode() : void{
		if(this.built)return;
		
		super.decode.call(this);

		for(let i=0;i<100;i++){
			let buf = this.readBuffer();
			if(buf.length == 0)
				break;
			this.testdata[i] = buf;
		}
	}
}

export default TestPacket;