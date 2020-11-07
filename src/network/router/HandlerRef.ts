import Packet from "../protocol/Packet"

type Handler = (pk:Packet)=>void;

class HandlerRef {
    public sign: string;
    public handler : Handler;
    constructor(sign:string,handler:Handler){
        this.sign=sign;
        this.handler=handler;
    }
}


export default HandlerRef;