import QueryDomainRequest from "../../request/QueryDomainRequest";
import AddressInfo from "../AddressInfo";
import IRegistryClient from "./IRegistryClient";
import DomainUpdatePacket from "../../protocol/packet/DomainUpdatePacket";
import util from "util";
import LimitedMap from "../../../utils/LimitedMap";
import Defer from "../../../utils/Defer";
import IRouter from "../../router/IRouter";
import NetRoute from "../../router/route/NetRoute";
import LifeCycle from "../../../utils/LifeCycle";

const debug = require("debug")("DomainClient");
const sleep = util.promisify(setTimeout);


class CacheExpiredError extends Error{};
class CacheNoExistsError extends Error{};

class DomainCache{
    public addrinfo : AddressInfo;
    public createTime : number = new Date().getTime();
    public expired : number;
    constructor(addrinfo : AddressInfo,expired : number = 10 * 1000){
        this.addrinfo = addrinfo;
        this.expired = expired;
    }
    isExpired() : boolean{
        let alive = this.createTime + this.expired - new Date().getTime();
        return alive < 0;
    }
}

class RegistryClient implements IRegistryClient{
    private address : AddressInfo;
    private router : IRouter;
    private request_seq : number = 0;
    private client_name : string;
    private entry_address : string ;
    private entry_port : number ;
    private loop : boolean = false;
    private cache = new LimitedMap<string,DomainCache>(1000);
    private closing_defer = new Defer<void>();
    private resolving : number = 0;
    private max_resolving : number = 300;
    private update_loop = true;

    private lifeCycle = new LifeCycle();

    constructor(
        client_name:string,
        entry_address:string,
        entry_port:number,
        server_address:AddressInfo,
        router:IRouter){
        this.address = server_address;
        this.router = router;
        this.client_name = client_name;
        this.entry_address = entry_address;
        this.entry_port = entry_port;
        if(this.client_name.length == 0)
           this.update_loop = false;

        this.router.getLifeCycle().when("ready").then(this.init.bind(this));
        
        this.router.getLifeCycle().on("closed",()=>{
            this.close();
        });


    }
    public getLifeCycle(){
        return this.lifeCycle;
    }
    private init(){

        if(this.update_loop)
            this.start_updating_loop();
        this.lifeCycle.setState("ready");
    }
	public async start_updating_loop(){
        
        let tick = 0;
        let loop_interval = 100;

        this.loop = true;
		while(this.loop == true){
            let tick_time = Math.floor((tick * loop_interval) / 1000);
            if(tick_time % 10 == 0){
                let update_addr = new AddressInfo(this.entry_address,this.entry_port);
                //console.log("update",update_addr);
                try{
                    this.updateAddress(this.client_name,update_addr);

                }catch(err){
                    console.error("updating address error",err);
                }
            }

             await sleep(loop_interval);
             tick++;
        }

        this.setClosed();
    }
    private setClosed(){
        this.closing_defer.resolve();
        this.lifeCycle.setState("closed");
    }
    async close(){
        if(this.lifeCycle.getState() == "closing" || this.lifeCycle.getState() =="closed")
            return;
        if(this.lifeCycle.getState() != "ready")
            throw new Error("at this state, instance can not close");
        if(!this.update_loop){
            this.lifeCycle.setState("closing");
            this.lifeCycle.setState("closed");
            return;
        }

        this.lifeCycle.setState("closing");
        this.loop = false;
        await this.closing_defer.promise;
     }
    private getCached(jgname:string){
        if(this.cache.has(jgname)){
            let cache = this.cache.get(jgname) as DomainCache;
            
            if(!cache.isExpired()) // meet cache
                return cache.addrinfo;
            else
                throw new CacheExpiredError("domain has expired");

        }else
            throw new CacheNoExistsError("doesn't have domain cache")
    }
    async resolve(jgname:string,timeout:number = 5000) : Promise<AddressInfo>{

        try{
            return this.getCached(jgname);
        }catch(err){

        }
    

        let addrinfo = await this.doResolve(jgname,timeout);
        debug("real resolve",jgname,addrinfo);

        this.cache.set(jgname,new DomainCache(addrinfo));

        return addrinfo;
    }
    private async doResolve(jgname:string,timeout:number){
        let start_time = new Date().getTime();
        let loop_interval = 200;
        let max_time = 10*1000;
        
        let loops = Math.floor(max_time / loop_interval);

        
        for(let i=0;i<loops;i++){
            
            try{
                
                this.resolving++;
                if(this.resolving > this.max_resolving)
                    throw new Error("reach max resolving limit")
                    
                try{ // try to check if have cache
                    let cache=this.getCached(jgname);
                    return cache;
                }catch(err){} // do a realResolve

                return await this.realResolve(jgname);
                
            }catch(err){   

            }finally{
                this.resolving--;
            }
            let time=new Date().getTime();

            if(time - start_time > timeout)
                break;
            
            await sleep(loop_interval);
        }
        throw new Error("resolve reach its max retry time");
        
    }
    private async realResolve(jgname:string){
        
        let req=new QueryDomainRequest(jgname,this.address,this.router,this.request_seq++);
        await req.getLifeCycle().when("ready");
        await req.run();
        
        return req.getResult();

    }
    updateAddress(jgname:string,addrinfo:AddressInfo):void{
        let pk=new DomainUpdatePacket();
        pk.jgname=jgname;
        pk.addrinfo = addrinfo;
        
        this.router.sendPacket(pk,new NetRoute(this.address.port,this.address.address));
    }

}

export default RegistryClient;