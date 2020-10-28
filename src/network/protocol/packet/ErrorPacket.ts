import BasePacket = require("../BasePacket");
class ErrorPacket extends BasePacket{
	public static packet_id : number = 7;
    public src_jgname : string="";
    public dst_path : string="";
    public error : Error = new Error();
    getName(){
        return "ErrorPacket";
    }
    constructor(){
        super();

    }
    encode(){
        super.encode.call(this);
        this.writeString(this.error.message);
        this.writeString(this.error.name);
        this.writeString(this.error.stack || "");
        
        this.writeString(this.src_jgname);
        this.writeString(this.dst_path);
        
    }
    decode(){
        super.decode.call(this);

        this.error.message = this.readString();
        this.error.name = this.readString();
        this.error.stack = this.readString();

        this.src_jgname = this.readString();
        this.dst_path = this.readString();
    }

}

export = ErrorPacket;
