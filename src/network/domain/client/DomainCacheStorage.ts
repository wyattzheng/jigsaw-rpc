import LimitedMap from "../../../utils/LimitedMap";
import AddressInfo from "../AddressInfo";
import DomainCache from "./DomainCache";

class CacheExpiredError extends Error{};
class CacheNoExistsError extends Error{};


class DomainCacheStorage{
    private cache = new LimitedMap<string,DomainCache>(1000);

    public addCached(jgname:string,jgid:string,addrinfo:AddressInfo){
        if(!this.cache.has(jgname))
            this.cache.set(jgname,new DomainCache());

        let set = this.cache.get(jgname) as DomainCache;
        set.add(jgid,addrinfo);
    }
    public getCachedOne(jgname:string){
        if(this.cache.has(jgname)){
            let cache = this.cache.get(jgname) as DomainCache;
            
            return cache.getRandomOne();
        }else
            throw new CacheNoExistsError("doesn't have domain cache")
    }
    public isCacheExpired(jgname:string){
        if(!this.cache.has(jgname))
            return true;

        return this.cache.get(jgname).isExpired();
    }
    public clearCached_jgname(jgname:string){
        if(!this.cache.has(jgname))
             return;

        this.cache.delete(jgname)
    }    
    public clearCached_jgid(jgid:string){
        let map = this.cache.getMap();
        let keys = map.keys();
        for(let key of keys){
            let item = this.cache.get(key);
            item.clearCache(jgid);
            if(item.addrinfos.length <= 0)
                this.cache.delete(key);

        }
    }



}


export default DomainCacheStorage;