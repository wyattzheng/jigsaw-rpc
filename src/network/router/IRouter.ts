import LifeCycle from "../../utils/LifeCycle";
import IPacket from "../protocol/IPacket";
import IRoute from "./route/IRoute";



interface IRouter{
    getLifeCycle():LifeCycle;
    getRouterId():string;
    sendPacket(pk:IPacket,route:IRoute) : void;
    handlePacket(pk:IPacket):void;
    plug(sign:string,handler:(pk:IPacket)=>void):number;
    unplug(sign:string,refid:number):void;
    close():Promise<void>;
}

export default IRouter;
