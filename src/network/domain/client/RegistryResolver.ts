import LimitedMap from "../../../utils/LimitedMap";
import IRouter from "../../../network/router/IRouter";
import AddressInfo from "../AddressInfo";
import DomainCacheStorage from "./QueryCacheStorage";
import assert from 'assert';
import LifeCycle from "../../../utils/LifeCycle";
import RegistryServerInfo from "../RegistryServerInfo";
import QueryDomainRequest from "../../../network/request/QueryDomainRequest";
import Defer from "../../../utils/Defer";
import Util  from "util";

const debug = require("debug")("DomainClient");
const sleep = Util.promisify(setTimeout);

type QuerySingleResult = {jgname:string,jgid:string,addr:AddressInfo};
type QueryResult = Array<QuerySingleResult>;

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

    async resolveAny(regpath:string,timeout:number = 5000) : Promise<QueryResult>{
        if(!this.cache.isCacheExpired(regpath))
            return this.cache.getCached(regpath);
        
        this.cache.clearCached_regpath(regpath);
        
        let queryinfos = await this.doOnceQuery(regpath,timeout);
        this.cache.addCached(regpath,queryinfos);
        
        return queryinfos;
    }
    async resolve(regpath:string,timeout:number = 5000) : Promise<QuerySingleResult>{
//        assert.strictEqual(this.lifeCycle.getState(),"ready");


//        console.log(queryinfos);
        
        let resolved = await this.resolveAny(regpath,timeout);
        
        debug("real resolve",regpath,resolved);
        
        let picked = this.pickFromQuery(resolved);

        return picked;
    }
    private pickFromQuery(result : QueryResult){
        let picked = Math.floor(Math.random() * result.length);
        return result[picked];
    }

    private async doOnceQuery(regpath:string,timeout:number = 5000){
        let promise;
        let queryinfos : QueryResult;
        if(!this.queryings.has(regpath)){
            promise = this.doRetryResolve(regpath,timeout);
            
            this.setRef(+1);
            this.queryings.set(regpath,promise);

            promise.catch((err)=>{
                
            }).finally(()=>{
                this.queryings.delete(regpath);
                this.setRef(-1);
            });

            queryinfos = await promise;

        }
        else{
            promise = this.queryings.get(regpath);
            queryinfos = await promise;
        }
        return queryinfos;
    }
    private async doRetryResolve(regpath:string,timeout:number) : Promise<QueryResult>{
        let start_time = new Date().getTime();
        let loop_interval = 200;
        let max_time = 10*1000;
        
        let loops = Math.floor(max_time / loop_interval);
        
        
        for(let i=0;i<loops;i++){
            try{
     
                let res = await this.doResolveRequest(regpath);
                if(res.length == 0)
                    throw new Error("result is empty");
                return res;
                
            }catch(err){   

            }finally{

            }
            let time=new Date().getTime();

            if(time - start_time > timeout)
                break;
            
            await sleep(loop_interval);
        }

        throw new Error("resolve reach its max retry time");
        
    }
    private async doResolveRequest(regpath:string) : Promise<QueryResult>{
        this.setRef(+1)
   
        let req=new QueryDomainRequest(regpath,this.server_address,this.router,this.request_seq++);
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
