import AbstractNetworkClient from "../../AbstractNetworkClient";
import assert = require("assert");
import RouterRule = require("./subrouter/RouterRule");
import Packet = require("../../protocol/Packet");
import AbstractRouter = require("./subrouter/AbstractRouter");

import PacketTypeRouter = require("./subrouter/PacketTypeRouter");
import RequestIdRouter = require("./subrouter/RequestIdRouter");
import IRouter = require("./subrouter/IRouter");
import Events = require("tiny-typed-emitter");

type Handler = (pk:Packet)=>void;

class HandlerRef {
    public refid: number;
    public refs : Map<AbstractRouter,number> = new Map();
    constructor(refid:number){
        this.refid = refid;
    }
    addRef(router:AbstractRouter,refid:number){
        this.refs.set(router,refid);
    }
}

interface PacketRouterEvent{
	ready: () => void;
	close: () => void;	
}


abstract class AbstractPacketRouter extends Events.TypedEmitter<PacketRouterEvent> implements IRouter{

    private client : AbstractNetworkClient;
    private routers : Array<AbstractRouter>;
    private map : Map<string,Array<HandlerRef>> = new Map(); 
    private refid:number = 0;
    private refs:number =0;

    constructor(client: AbstractNetworkClient){
        super();

        this.client = client;

        this.client.on("packet",this.handlePacket.bind(this));

        this.routers = [];
        this.map=new Map();

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
        this.client.close();
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

        let refid = this.refid++;
        let refs : Array<number>= [];

        if(!this.map.has(sign))
            this.map.set(sign,[]);

        let handlers = this.map.get(sign) as Array<HandlerRef>;
        let handler_ref = new HandlerRef(refid);
        
        
        for(let router of this.routers)
           handler_ref.addRef(router,router.plug(sign,handler));
        
        handlers.push(handler_ref);
        
        return refid;
    }
    unplug(sign:string,refid:number):void{
        if(!this.map.has(sign))
            throw new Error("this sign hasn't been unplugged");

        let handlers = this.map.get(sign) as Array<HandlerRef>;

        let handler_ref = handlers.find((x)=>(x.refid==refid));

        if(!handler_ref)
            throw new Error("can't find this handler ref");
        
        
        for(let router of this.routers){
            let rid=handler_ref.refs.get(router) as number;
            router.unplug(sign,rid);
        }

    }

}

export = AbstractPacketRouter;