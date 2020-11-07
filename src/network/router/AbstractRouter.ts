import Packet from "../protocol/Packet";
import IRouter from "./IRouter";
import IRoute from "./route/IRoute";

import HandlerMap from "../../utils/HandlerMap";
import { TypedEmitter } from "tiny-typed-emitter";;

interface RouterEvent{
	ready: () => void;
    close: () => void;	
    error: (err : Error) => void;
}

type Handler = (pk:Packet)=>void;

abstract class AbstractRouter extends HandlerMap<Handler> implements IRouter{
    private eventEmitter : TypedEmitter<RouterEvent>;
    private routerId: string;
    constructor(){
        super();
        this.eventEmitter = new TypedEmitter<RouterEvent>();
        this.routerId = Math.random()+"";
    }
    public getEventEmitter() : TypedEmitter<RouterEvent>{
        return this.eventEmitter;
    }
    public getRouterId() : string{
        return this.routerId;
    }
    public getState() : string{
        return "ready";
    }
    public abstract sendPacket(pk : Packet,route : IRoute) : void;
    public abstract handlePacket(pk : Packet) : void;
}

export default AbstractRouter;