import IPacket from "../protocol/IPacket";
import IRouter from "./IRouter";
import IRoute from "./route/IRoute";

import HandlerMap from "../../utils/HandlerMap";
import { TypedEmitter } from "tiny-typed-emitter";
import LifeCycle from "../../utils/LifeCycle";
import RandomGen from "../../utils/RandomGen";


type Handler = (pk:IPacket)=>void;

abstract class AbstractRouter extends HandlerMap<Handler> implements IRouter{
    private lifeCycle = new LifeCycle();
    private routerId: string;
    constructor(){
        super();
        this.routerId =  RandomGen.GetRandomHash(6);
    }
    public getLifeCycle(){
        return this.lifeCycle;
    }
    public getRouterId() : string{
        return this.routerId;
    }

    public abstract close():Promise<void>;
    public abstract sendPacket(pk : IPacket,route : IRoute) : Promise<void>;
    public abstract handlePacket(pk : IPacket) : Promise<void>;
}

export default AbstractRouter;