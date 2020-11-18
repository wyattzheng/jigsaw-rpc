import LimitedMap from "../../../utils/LimitedMap";
import AddressInfo from "../AddressInfo";
import DomainCache from "./QueryCache";

class CacheExpiredError extends Error{};
class CacheNoExistsError extends Error{};


type RegNode = {jgname:string,jgid:string,address:AddressInfo,updateTime:number};
type QueryResult = Array<RegNode>;

class QueryCacheStorage{
    private cache = new LimitedMap<string,DomainCache>(1000);

    public addCached(regpath:string,qresult : QueryResult){
        if(!this.cache.has(regpath))
            this.cache.set(regpath,new DomainCache(qresult));
    }
    public getCached(regpath:string){
        if(this.cache.has(regpath)){
            let cache = this.cache.get(regpath) as DomainCache;
            
            return cache.getData();
        }else
            throw new CacheNoExistsError("doesn't have domain cache")
    }
    public isCacheExpired(regpath:string){
        if(!this.cache.has(regpath))
            return true;

        return this.cache.get(regpath).isExpired();
    }
    public clearCached_regpath(regpath:string){
        if(!this.cache.has(regpath))
             return;

        this.cache.delete(regpath)
    }
    public clearCached_jgid(jgid:string){
        let map = this.cache.getMap();
        let keys = map.keys();
        for(let key of keys){
            let item = this.cache.get(key);
            item.clearCache_jgid(jgid);
            if(item.addrinfos.length <= 0)
                this.cache.delete(key);
        }
    }



}


export default QueryCacheStorage;