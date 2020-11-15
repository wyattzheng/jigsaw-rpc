import LifeCycle from "../../utils/LifeCycle";
import IPacket from "../protocol/IPacket";
import IRoute from "./route/IRoute";



interface IRouter{
    getLifeCycle():LifeCycle;
    getRouterId():string;
    sendPacket(pk:IPacket,route:IRoute) : Promise<void>;
    handlePacket(pk:IPacket):Promise<void>;
    plug(sign:string,handler:(pk:IPacket)=>Promise<void>):number;
    unplug(sign:string,refid:number):void;
    close():Promise<void>;
}

export default IRouter;
