import Packet = require("../../../protocol/Packet");

type Handler = (pk:Packet)=>void;

interface IRouter{
    handlePacket(pk:Packet):void;
    plug(sign:string,handler:Handler):number;
    unplug(sign:string,refid:number):void;
    
}

export = IRouter;
