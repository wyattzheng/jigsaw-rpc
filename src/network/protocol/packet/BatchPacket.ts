import BasePacket from "../BasePacket";

class BatchPacket extends BasePacket{
    public static packet_id : number = 14;
    public bufs : Buffer[] = [];
	constructor(){
		super();
        this.buffer = Buffer.allocUnsafe(1400);
		
    }
	release(){
		super.release.call(this);
		
	}
	getName(){
		return "BatchPacket";
	}	
	encode(){			
        super.encode.call(this);
        
        let length = 0;
        for(let buf of this.bufs)
            length += buf.length;
        
        this.enlarge(length+1400);

        this.writeUInt16(this.bufs.length);
        for(let buf of this.bufs)
            this.writeBuffer(buf);
    
	}
	decode(){
        super.decode.call(this);

        this.bufs = [];
        let bufslen = this.readUInt16();
        for(let i=0;i<bufslen;i++)
            this.bufs[i] = this.readBuffer();

	}
}

export default BatchPacket;

