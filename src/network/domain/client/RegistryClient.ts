import QueryDomainRequest from "../../request/QueryDomainRequest";
import AddressInfo from "../AddressInfo";
import IRegistryClient from "./IRegistryClient";
import DomainUpdatePacket from "../../protocol/packet/DomainUpdatePacket";
import DomainPurgePacket from "../../protocol/packet/DomainPurgePacket";

import util from "util";
import LimitedMap from "../../../utils/LimitedMap";
import Defer from "../../../utils/Defer";
import IRouter from "../../router/IRouter";
import NetRoute from "../../router/route/NetRoute";
import LifeCycle from "../../../utils/LifeCycle";
import assert from 'assert';

import PingRequest from "../../request/PingRequest";
import DomainClientHandler from "../../../network/handler/DomainClientHandler";
import PurgeDomainRequest from "../../../network/request/PurgeDomainRequest";
import Url from "url";
import RegistryServerInfo from "../RegistryServerInfo";
import DomainCacheStorage from "./DomainCacheStorage";


type QueryResult = Array<{jgid:string,addr:AddressInfo}>;

const debug = require("debug")("DomainClient");
const sleep = util.promisify(setTimeout);

class RegistryClient implements IRegistryClient{
    private address : RegistryServerInfo;
    private router : IRouter;
    private request_seq : number = 0;
    private client_id : string;
    private client_name : string;
    private entries : Array<AddressInfo> ;
    private listen_port : number ;
    private loop : boolean = false;
    private handler : DomainClientHandler;
    private ping_seq = 0;

    private cache = new DomainCacheStorage();
    
    private pingings = new LimitedMap<string,Promise<AddressInfo>>(100);
    private queryings = new LimitedMap<string,Promise<QueryResult>>(100);

    private regservers : Array<RegistryServerInfo>;

    private closing_defer = new Defer<void>();
    private ref : number = 0;

    private isAnonymous = false;

    private lifeCycle = new LifeCycle();


    constructor(
        client_id:string,
        client_name:string,
        entries:Array<AddressInfo>,
        listen_port:number,
        server_address:RegistryServerInfo,
        regservers:Array<RegistryServerInfo>,
        router:IRouter){
        
        this.address = server_address;
        this.router = router;
        this.client_id = client_id;
        this.client_name = client_name;
        this.entries = entries;
        this.regservers = regservers;

        this.listen_port = listen_port;
        if(this.client_name.length == 0)
           this.isAnonymous = true;

        this.handler = new DomainClientHandler(this.router);

        this.handler.getEventEmitter().on("domain_purged",this.handleDomainPurgedEvent.bind(this));

        this.router.getLifeCycle().when("ready").then(this.init.bind(this));
        
        this.router.getLifeCycle().on("closed",()=>{
            this.close();
        });

    }
    public getLifeCycle(){
        return this.lifeCycle;
    }
    private handleDomainPurgedEvent(jgid:string){
        this.cache.clearCached_jgid(jgid);
    }
    private init(){

        this.start_updating_loop();


        this.lifeCycle.setState("ready");

    }
	public async start_updating_loop(){
        
        let tick = 0;
        let loop_interval = 100;
        let update_per_loops = 100;

        this.setRef(+1);
        this.loop = true;
		while(this.loop == true){
            
            if(tick % update_per_loops == 0){
                //console.log("update",update_addr);
                try{

                    if(this.isAnonymous)
                        this.updateAddress(this.client_name)
                    else
                        this.updateAddress(this.client_name,this.entries);

                }catch(err){
                    console.error("updating address error",err);
                }
            }

             await sleep(loop_interval);
             tick++;
        }
        this.setRef(-1);        
    }
    async close(){
        if(this.lifeCycle.getState() == "closing" || this.lifeCycle.getState() =="closed")
            return;
        if(this.lifeCycle.getState() != "ready")
            throw new Error("at this state, instance can not close");
        

        this.lifeCycle.setState("closing");
        this.loop = false;


        await this.purgeDomain();
        await this.handler.close();
    
        await this.closing_defer.promise;

        this.lifeCycle.setState("closed");
    }
    private async purgeDomain(){
        try{
            this.setRef(+1)
            let req = new PurgeDomainRequest(this.client_id,this.address,this.router,0);
            await req.getLifeCycle().when("ready");
            await req.run();
        }catch(err){

        }finally{
            this.setRef(-1);
        }
    }

    async resolve(jgname:string,timeout:number = 5000) : Promise<AddressInfo>{
        assert.strictEqual(this.lifeCycle.getState(),"ready");

        if(!this.cache.isCacheExpired(jgname))
            return this.cache.getCachedOne(jgname);
   
        
        this.cache.clearCached_jgname(jgname);

        let promise;
        let queryinfos : QueryResult;
        if(!this.queryings.has(jgname)){
            promise = this.doRealResolve(jgname,timeout);
            this.queryings.set(jgname,promise);
            queryinfos = await promise;
            this.queryings.delete(jgname);

        }
        else{
            promise = this.queryings.get(jgname);
            queryinfos = await promise;

        }

                    
        debug("real resolve",jgname,queryinfos);
        let tests : Array<Promise<AddressInfo>> =[];

        
        for(let index in queryinfos){
            let promise;
            let jgid = queryinfos[index].jgid;
            let addr = queryinfos[index].addr;
            let key = addr.stringify();
            if(this.pingings.has(key))
                promise = this.pingings.get(key)
            else{
                this.setRef(+1);
                promise = this.doPing(addr).finally(()=>{
                    this.setRef(-1);
                });
            }
            
            this.pingings.set(key,promise);

            promise.then((ret)=>{
                this.cache.addCached(jgname,jgid,ret);

            }).catch((err)=>{
                //ping is timeout, ignore
            }).finally(()=>{
            });

            
            tests[index] = promise;
        }

    

        if(tests.length == 0){
            return this.cache.getCachedOne(jgname);
        }else{
            await Promise.race(tests);

            return this.cache.getCachedOne(jgname);
        }
    }
    private setRef(offset:number){
        this.ref+=offset;
        if(this.lifeCycle.getState() == "closing" && this.ref == 0){
            
            this.closing_defer.resolve();
        }
    }
    private async doPing(addrinfo:AddressInfo){        
        let ping_req = new PingRequest(addrinfo,this.router,this.ping_seq++);
        await ping_req.getLifeCycle().when("ready");
        await ping_req.run();

        return addrinfo;
    }


    private async doRealResolve(jgname:string,timeout:number) : Promise<QueryResult>{
        let start_time = new Date().getTime();
        let loop_interval = 200;
        let max_time = 10*1000;
        
        let loops = Math.floor(max_time / loop_interval);

        
        for(let i=0;i<loops;i++){
            this.setRef(+1)
            try{
     
                let res = await this.realResolveRequest(jgname);
                return res;
                
            }catch(err){   
                //console.log(err);
            }finally{
                this.setRef(-1)
            }
            let time=new Date().getTime();

            if(time - start_time > timeout)
                break;
            
            await sleep(loop_interval);
        }
        throw new Error("resolve reach its max retry time");
        
    }
    private async realResolveRequest(jgname:string) : Promise<QueryResult>{
        
        let req=new QueryDomainRequest(jgname,this.address,this.router,this.request_seq++);
        await req.getLifeCycle().when("ready");
        await req.run();
    
        return req.getResult();

    }
    updateAddress(jgname:string,addrinfos?:Array<AddressInfo>):void{
        let pk=new DomainUpdatePacket();
        pk.jgid = this.client_id;
        pk.jgname=jgname;
    
        if(addrinfos)
            pk.addrinfos = addrinfos;
        else
            pk.can_update = false;
        
        this.router.sendPacket(pk,new NetRoute(this.address.port,this.address.address));

        for(let regserver of this.regservers){
            this.router.sendPacket(pk,new NetRoute(regserver.port,regserver.address));
        }
    }

}

export default RegistryClient;
