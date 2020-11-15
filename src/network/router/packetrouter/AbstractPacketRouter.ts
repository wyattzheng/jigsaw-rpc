import INetworkClient from "../../client/INetworkClient";
import IPacket from "../../protocol/IPacket";
import AbstractRouter from "../AbstractRouter";

import PacketTypeRouter from "../PacketTypeRouter";
import RequestIdRouter from "../RequestIdRouter";
import HandlerMap from "../../../utils/HandlerMap";
import IRoute from "../route/IRoute";
import assert from "assert";

type Handler = (pk:IPacket)=>Promise<void>;


abstract class AbstractPacketRouter extends AbstractRouter{

    protected client : INetworkClient;
    private routers : Array<AbstractRouter>;
    private handler_map = new HandlerMap<Array<number>>();
    private plug_ref = 0 ;
    
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
    abstract async sendPacket(pk:IPacket,route:IRoute) : Promise<void>;
    public async close(){
        
        assert.strictEqual(this.plug_ref,0);

        for(let router of this.routers){
            router.close();
        }

    }
    private initRouters(){
        this.routers.push(new PacketTypeRouter());
        this.routers.push(new RequestIdRouter());

        
    }
    public async handlePacket(pk : IPacket){ // not a good design here, to do: Filter Class

        for(let router of this.routers){
            await router.handlePacket(pk);
        }
    }
    
    public getClient() : INetworkClient{
        return this.client;
    }

    plug( sign:string, handler:Handler) : number{
        this.plug_ref++;

        let refids=[]
        for(let router of this.routers){
            let sid=router.plug(sign,handler);         
            refids.push(sid);  
        }

        return this.handler_map.plug(sign,refids);
    }
    unplug(sign:string,refid:number):void{
        this.plug_ref--;

        let refids=this.handler_map.getMapData(sign,refid);
        for(let index in refids){
            this.routers[index].unplug(sign,refids[index]);
        }
        this.handler_map.unplug(sign,refid);
        
    }

}

export default AbstractPacketRouter;