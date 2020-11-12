import IRegistryStorage from "./IRegistryStorage";
import AddressInfo from "../AddressInfo";
import { TypedEmitter } from "tiny-typed-emitter";

type AddressSet = Array<{jgname:string,addr:AddressInfo}>;

interface StorageEvent{
    DomainPurgeEvent:(jgid:string)=>void;
}

type QueryResult = Array<{jgid:string,addr:AddressInfo}>;

class RegistryStorage implements IRegistryStorage{
    private map = new Map<string,AddressSet>();
    private eventEmitter = new TypedEmitter<StorageEvent>();
    constructor(){
        
    }
    
    private getAddressSet(jgid:string) : AddressSet{
        if(!this.map.has(jgid))
            this.map.set(jgid,[]);
        return  this.map.get(jgid) as AddressSet;
    }
    getEventEmitter(){
        return this.eventEmitter;   
    }
    setAddress(jgid:string,jgname:string,addr:AddressInfo){
        let set = this.getAddressSet(jgid);
        
        let exists = set.findIndex((x)=>{
            return x.jgname == jgname && x.addr.address == addr.address && x.addr.port == addr.port
        }) != -1;

        if(!exists)
            set.push({jgname,addr});


    }
    removeAddress(jgid:string){
      
        if(!this.map.has(jgid))
            throw new Error("this jgid doesn't exist");

        this.map.delete(jgid);
        this.eventEmitter.emit("DomainPurgeEvent", jgid);
    }
    queryAddress(jgname:string) : QueryResult{

        let keys = this.map.keys();
        let ret : QueryResult = [];

        for(let name of keys){
            let set = this.getAddressSet(name);
            
           
            Array.from(set).map((x)=>{
                if(x.jgname == jgname)
                    ret.push({jgid:name,addr:x.addr});
            });
        }

        if(ret.length == 0)
            throw new Error("can't resolve this jgname");

        return ret;
    }

}

export default RegistryStorage;
