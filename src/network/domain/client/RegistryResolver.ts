import LimitedMap from "../../../utils/LimitedMap";
import IRouter from "../../../network/router/IRouter";
import AddressInfo from "../AddressInfo";
import DomainCacheStorage from "./DomainCacheStorage";
import assert from 'assert';
import LifeCycle from "../../../utils/LifeCycle";
import RegistryServerInfo from "../RegistryServerInfo";
import QueryDomainRequest from "../../../network/request/QueryDomainRequest";
import Defer from "../../../utils/Defer";

import Util = require("util");

const debug = require("debug")("DomainClient");
const sleep = Util.promisify(setTimeout);

type QueryResult = Array<{jgid:string,addr:AddressInfo}>;

class RegistryResolver{
    private ref : number = 0;

    private router : IRouter;
    private cache = new DomainCacheStorage();
    private queryings = new LimitedMap<string,Promise<QueryResult>>(100);
    private lifeCycle = new LifeCycle();
    private request_seq : number = 0;
    private server_address:RegistryServerInfo;
    private closing_defer = new Defer<void>();

    constructor(server_address:RegistryServerInfo, router:IRouter){

        this.server_address = server_address;
        this.router = router;

        this.lifeCycle.setState("starting");
        this.lifeCycle.setState("ready");
    }

    async resolve(jgname:string,timeout:number = 5000) : Promise<AddressInfo>{
//        assert.strictEqual(this.lifeCycle.getState(),"ready");

        if(!this.cache.isCacheExpired(jgname))
            return this.cache.getCachedOne(jgname);
   
        
        this.cache.clearCached_jgname(jgname);

                    
        let queryinfos = await this.doOnceQuery(jgname,timeout);

        debug("real resolve",jgname,queryinfos);
        
        this.cache.addCached(jgname,queryinfos[0].jgid,queryinfos[0].addr);

        return queryinfos[0].addr;

    }
    


    private async doOnceQuery(jgname:string,timeout:number = 5000){
        let promise;
        let queryinfos : QueryResult;
        if(!this.queryings.has(jgname)){
            promise = this.doRetryResolve(jgname,timeout);
            this.setRef(+1);
            promise.then(()=>{
                this.setRef(-1);
            })

            this.queryings.set(jgname,promise);
            queryinfos = await promise;
            this.queryings.delete(jgname);

        }
        else{
            promise = this.queryings.get(jgname);
            queryinfos = await promise;
        }
        return queryinfos;
    }
    private async doRetryResolve(jgname:string,timeout:number) : Promise<QueryResult>{
        let start_time = new Date().getTime();
        let loop_interval = 200;
        let max_time = 10*1000;
        
        let loops = Math.floor(max_time / loop_interval);
        
        
        for(let i=0;i<loops;i++){
            try{
     
                let res = await this.doResolveRequest(jgname);
                return res;
                
            }catch(err){   
                //console.log(err);
            }finally{

            }
            let time=new Date().getTime();

            if(time - start_time > timeout)
                break;
            
            await sleep(loop_interval);
        }

        throw new Error("resolve reach its max retry time");
        
    }
    private async doResolveRequest(jgname:string) : Promise<QueryResult>{
        this.setRef(+1)
   
        let req=new QueryDomainRequest(jgname,this.server_address,this.router,this.request_seq++);
        req.getLifeCycle().on("closed",()=>{
            this.setRef(-1);
        })
        await req.getLifeCycle().when("ready");
        await req.run();
    
        return req.getResult();

    }

    public getCache(){
        return this.cache;
    }


    public async close(){
        let state = this.lifeCycle.getState();
        assert(state == "ready");


        this.lifeCycle.setState("closing");
        this.setRef(0);
        await this.closing_defer.promise;
        this.lifeCycle.setState("closed");

    }

    private setRef(offset:number){
        this.ref+=offset;
        if(this.lifeCycle.getState() == "closing" && this.ref == 0){
            this.closing_defer.resolve();
        }
    }


}

export default RegistryResolver;
