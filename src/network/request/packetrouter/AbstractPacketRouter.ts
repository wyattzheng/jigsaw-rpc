import AbstractNetworkClient from "../../AbstractNetworkClient";
import assert = require("assert");
import RouterRule = require("./subrouter/RouterRule");
import Packet = require("../../protocol/Packet");
import AbstractRouter = require("./subrouter/AbstractRouter");

import PacketTypeRouter = require("./subrouter/PacketTypeRouter");
import RequestIdRouter = require("./subrouter/RequestIdRouter");
import IRouter = require("./subrouter/IRouter");
import Events = require("tiny-typed-emitter");
import AbstractHandler = require("@/network/handler/AbstractHandler");
import HandlerMap = require("../../../utils/HandlerMap");

type Handler = (pk:Packet)=>void;


interface PacketRouterEvent{
	ready: () => void;
	close: () => void;	
}


abstract class AbstractPacketRouter extends Events.TypedEmitter<PacketRouterEvent> implements IRouter{

    private client : AbstractNetworkClient;
    private routers : Array<AbstractRouter>;
    private handler_map = new HandlerMap<Array<number>>();

    constructor(client: AbstractNetworkClient){
        super();

        this.client = client;

        this.client.on("packet",this.handlePacket.bind(this));

        this.routers = [];

        this.client.on("ready",()=>{
            this.emit("ready");
        })
        this.client.on("close",()=>{
            this.emit("close");
        })


        this.initRouters();
    }
    public getState(){
        return this.client.getState();
    }
    public close(){
        //this.client.close();

    }
    private initRouters(){
        this.routers.push(new PacketTypeRouter());
        this.routers.push(new RequestIdRouter());

        
    }
    public handlePacket(pk : Packet){ // not a good design here, to do: Filter Class
        for(let router of this.routers){
            router.handlePacket(pk);
        }
    }
    
    public getClient() : AbstractNetworkClient{
        return this.client;
    }

    plug( sign:string, handler:Handler) : number{
        let refids=[]
        for(let router of this.routers){
            let sid=router.plug(sign,handler);         
            refids.push(sid);  
        }

        return this.handler_map.plug(sign,refids);
    }
    unplug(sign:string,refid:number):void{
        let refids=this.handler_map.getMapData(sign,refid);
        for(let index in refids){
            this.routers[index].unplug(sign,refids[index]);
        }
        this.handler_map.unplug(sign,refid);
        
    }

}

export = AbstractPacketRouter;