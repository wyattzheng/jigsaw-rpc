import IDomainStorage from "./IRegistryStorage";
import AddressInfo from "../AddressInfo";

class DomainStorage implements IDomainStorage{
    private map = new Map<string,AddressInfo>();
    constructor(){
        
    }
    setAddress(jgname:string,addr:AddressInfo){
        this.map.set(jgname,addr);
    }
    getAddress(jgname:string) : AddressInfo{
        if(!this.map.has(jgname))
            throw new Error("doesn't have this address");
        
        return this.map.get(jgname) as AddressInfo;
    }

}

export default DomainStorage;