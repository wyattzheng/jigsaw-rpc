import LifeCycle from "../../utils/LifeCycle";
import { TypedEmitter } from "tiny-typed-emitter";
import IPacket from "../protocol/IPacket";
import IRoute from "./route/IRoute";


interface RouterEvent{
	ready: () => void;
    close: () => void;	
    error: (err : Error) => void;
}
interface IRouter{
    getLifeCycle():LifeCycle;
    getRouterId():string;
    sendPacket(pk:IPacket,route:IRoute) : void;
    handlePacket(pk:IPacket):void;
    plug(sign:string,handler:(pk:IPacket)=>void):number;
    unplug(sign:string,refid:number):void;
    
}

export default IRouter;
