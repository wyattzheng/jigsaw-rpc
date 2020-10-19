import BasePacket = require("../BasePacket");
class ErrorPacket extends BasePacket{
	public static packet_id : number = 7;

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
    }
    decode(){
        super.decode.call(this);

        this.error.message = this.readString();
        this.error.name = this.readString();
        this.error.stack = this.readString();
    }

}

export = ErrorPacket;
