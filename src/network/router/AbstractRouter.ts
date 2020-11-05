import Packet = require("../protocol/Packet");
import IRouter = require("./IRouter");
import IRoute = require("./route/IRoute");

import HandlerMap = require("../../utils/HandlerMap");
import events = require("tiny-typed-emitter");;

interface RouterEvent{
	ready: () => void;
    close: () => void;	
    error: (err : Error) => void;
}

type Handler = (pk:Packet)=>void;

abstract class AbstractRouter extends HandlerMap<Handler> implements IRouter{
    private eventEmitter : events.TypedEmitter<RouterEvent>;
    private routerId: string;
    constructor(){
        super();
        this.eventEmitter = new events.TypedEmitter<RouterEvent>();
        this.routerId = Math.random()+"";
    }
    public getEventEmitter() : events.TypedEmitter<RouterEvent>{
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

export = AbstractRouter;