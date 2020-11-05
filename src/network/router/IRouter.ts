import { TypedEmitter } from "tiny-typed-emitter";
import Packet = require("../protocol/Packet");
import IRoute = require("./route/IRoute");


interface RouterEvent{
	ready: () => void;
    close: () => void;	
    error: (err : Error) => void;
}
interface IRouter{
    getEventEmitter():TypedEmitter<RouterEvent>;
    getState():string;
    getRouterId():string;
    sendPacket(pk:Packet,route:IRoute) : void;
    handlePacket(pk:Packet):void;
    plug(sign:string,handler:(pk:Packet)=>void):number;
    unplug(sign:string,refid:number):void;
    
}

export = IRouter;
