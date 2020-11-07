import INetworkClient from "../../client/INetworkClient";
import IPacket from "../../protocol/IPacket";
import AbstractRouter from "../AbstractRouter";

import PacketTypeRouter from "../PacketTypeRouter";
import RequestIdRouter from "../RequestIdRouter";
import HandlerMap from "../../../utils/HandlerMap";
import IRoute from "../route/IRoute";

type Handler = (pk:IPacket)=>void;


abstract class AbstractPacketRouter extends AbstractRouter{

    protected client : INetworkClient;
    private routers : Array<AbstractRouter>;
    private handler_map = new HandlerMap<Array<number>>();

    constructor(client: INetworkClient){
        super();

        this.client = client;
        this.routers = [];

        
        this.client.getEventEmitter().on("packet",this.handlePacket.bind(this));

        
        this.initRouters();
    }
    getLifeCycle(){
        return this.client.getSocket().getLifeCycle();
    }
    abstract sendPacket(pk:IPacket,route:IRoute) : void;
    public close(){
        //this.client.close();
    }
    private initRouters(){
        this.routers.push(new PacketTypeRouter());
        this.routers.push(new RequestIdRouter());

        
    }
    public handlePacket(pk : IPacket){ // not a good design here, to do: Filter Class
        for(let router of this.routers){
            router.handlePacket(pk);
        }
    }
    
    public getClient() : INetworkClient{
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

export default AbstractPacketRouter;