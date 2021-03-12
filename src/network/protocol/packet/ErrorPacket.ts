import BasePacket from "../BasePacket";
import {serializeError,deserializeError} from "serialize-error";

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
        
        let err_str_buf = Buffer.from(JSON.stringify(serializeError(this.error)));
        this.enlarge(1400 + err_str_buf.length);
        this.writeLargeBuffer(err_str_buf);
        
        this.writeString(this.src_jgname);
        this.writeString(this.dst_path);
    }
    decode(){
        super.decode.call(this);

        let err_str_buf = this.readLargeBuffer().toString();
        this.error = deserializeError(JSON.parse(err_str_buf));
        
        this.src_jgname = this.readString();
        this.dst_path = this.readString();
    }

}

export default ErrorPacket;
