import IDomainStorage from "./IRegistryStorage";
import AddressInfo from "../AddressInfo";

type AddressSet = Array<{jgname:string,addr:AddressInfo}>;

class DomainStorage implements IDomainStorage{
    private map = new Map<string,AddressSet>();
    constructor(){
        
    }
    private getAddressSet(jgid:string) : AddressSet{
        if(!this.map.has(jgid))
            this.map.set(jgid,[]);
        return  this.map.get(jgid) as AddressSet;
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
    }
    getAddress(jgname:string) : Array<AddressInfo>{

        let keys = this.map.keys();
        let ret : Array<AddressInfo> = [];
        for(let name of keys){
            let set = this.getAddressSet(name);
            
           
            Array.from(set).map((x)=>{
                if(x.jgname == jgname)
                    ret.push(x.addr);
            });
        }

        if(ret.length == 0)
            throw new Error("can't resolve this jgname");

        return ret;
    }

}

export default DomainStorage;
