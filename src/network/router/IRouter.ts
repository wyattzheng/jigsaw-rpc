import { TypedEmitter } from "tiny-typed-emitter";
import Packet from "../protocol/Packet";
import IRoute from "./route/IRoute";


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

export default IRouter;
