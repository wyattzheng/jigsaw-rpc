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
import PingHandler from "../../../network/handler/PingHandler";
import PurgeDomainRequest from "../../../network/request/PurgeDomainRequest";



const debug = require("debug")("DomainClient");
const sleep = util.promisify(setTimeout);


class CacheExpiredError extends Error{};
class CacheNoExistsError extends Error{};

class DomainCache{
    public addrinfos : Array<AddressInfo> = [];
    public createTime : number = new Date().getTime();
    public expired : number;
    constructor(expired : number = 10 * 1000){
        this.expired = expired;
    }
    add(addrinfo : AddressInfo){
        let exists = this.addrinfos.findIndex((x)=>{
            return x.address == addrinfo.address && x.port == addrinfo.port;
        }) != -1;
        if(!exists)
            this.addrinfos.push(addrinfo);
    }
    getRandomOne(){

        let index = Math.floor(this.addrinfos.length * Math.random());
        return this.addrinfos[index];
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
    private client_id : string;
    private client_name : string;
    private entries : Array<AddressInfo> ;
    private listen_port : number ;
    private loop : boolean = false;
    private ping_handler : PingHandler;
    private ping_seq = 0;
    
    private cache = new LimitedMap<string,DomainCache>(1000);
    private pingings = new LimitedMap<string,Promise<AddressInfo>>(100);

    private queryings = new LimitedMap<string,Promise<Array<AddressInfo>>>(100);

    private closing_defer = new Defer<void>();
    private resolving : number = 0;
    private max_resolving : number = 300;
    private ref : number = 0;

    private update_loop = true;

    private lifeCycle = new LifeCycle();


    constructor(
        client_id:string,
        client_name:string,
        entries:Array<AddressInfo>,
        listen_port:number,
        server_address:AddressInfo,
        router:IRouter){
        
        this.address = server_address;
        this.router = router;
        this.client_id = client_id;
        this.client_name = client_name;
        this.entries = entries;


        this.listen_port = listen_port;
        if(this.client_name.length == 0)
           this.update_loop = false;

        this.ping_handler = new PingHandler(this.router);

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

        this.setRef(+1);
        this.loop = true;
		while(this.loop == true){
            let tick_time = Math.floor((tick * loop_interval) / 1000);
            if(tick_time % 10 == 0){
                //console.log("update",update_addr);
                try{

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
        await this.ping_handler.close();
    
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
    private addCached(jgname:string,addrinfo:AddressInfo){
        if(!this.cache.has(jgname))
            this.cache.set(jgname,new DomainCache());

        let set = this.cache.get(jgname) as DomainCache;
        set.add(addrinfo);
    }
    private getCachedOne(jgname:string){
        if(this.cache.has(jgname)){
            let cache = this.cache.get(jgname) as DomainCache;
            
            if(!cache.isExpired()) // meet cache
                return cache.getRandomOne();
            else
                throw new CacheExpiredError("domain has expired");

        }else
            throw new CacheNoExistsError("doesn't have domain cache")
    }
    async resolve(jgname:string,timeout:number = 5000) : Promise<AddressInfo>{
        assert.strictEqual(this.lifeCycle.getState(),"ready");

        try{
            let cached = this.getCachedOne(jgname);
            return cached
        }catch(err){
    
        }
    
   
        /*this.resolving++;
        if(this.resolving > this.max_resolving)
            throw new Error("reach max resolving limit")
        */
        let promise;
        let addrinfos;
        if(!this.queryings.has(jgname)){
            promise = this.doRealResolve(jgname,timeout);
            this.queryings.set(jgname,promise);
            addrinfos = await promise;
            this.queryings.delete(jgname);

        }
        else{
            promise = this.queryings.get(jgname);
            addrinfos = await promise;

        }

                    
        debug("real resolve",jgname,addrinfos);
        let tests : Array<Promise<AddressInfo>> =[];

        
        for(let index in addrinfos){
            let promise;
            
            let key = addrinfos[index].stringify();
            if(this.pingings.has(key))
                promise = this.pingings.get(key)
            else{
                this.setRef(+1);
                promise = this.doPing(addrinfos[index]).finally(()=>{
                    this.setRef(-1);
                });
            }
            
            this.pingings.set(key,promise);

            promise.then((ret)=>{
                this.addCached(jgname,ret);
                
            }).catch((err)=>{
                //ping is timeout, ignore
            }).finally(()=>{
            });

            
            tests[index] = promise;
        }

    

        if(tests.length == 0){
            return this.getCachedOne(jgname);
        }else{
            await Promise.race(tests);


            //this.resolving--;

            return this.getCachedOne(jgname);
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


    private async doRealResolve(jgname:string,timeout:number) : Promise<Array<AddressInfo>>{
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
    private async realResolveRequest(jgname:string){
        
        let req=new QueryDomainRequest(jgname,this.address,this.router,this.request_seq++);
        await req.getLifeCycle().when("ready");
        await req.run();
    
        return req.getResult();

    }
    updateAddress(jgname:string,addrinfos:Array<AddressInfo>):void{
        let pk=new DomainUpdatePacket();
        pk.jgid = this.client_id;
        pk.jgname=jgname;
        pk.addrinfos = addrinfos;
        
        this.router.sendPacket(pk,new NetRoute(this.address.port,this.address.address));
    }

}

export default RegistryClient;
