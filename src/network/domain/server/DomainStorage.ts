import IDomainStorage = require("./IDomainStorage");
import DomainOption = require("./DomainOption");
import AddressInfo = require("../AddressInfo");

class DomainStorage implements IDomainStorage{
    private map = new Map<string,AddressInfo>();
    constructor(){
        
    }
    setAddress(jgname:string,addr:AddressInfo){
        this.map.set(jgname,addr);
    }
    getAddress(jgname:string){
        if(!this.map.has(jgname))
            throw new Error("doesn't have this address");
        
        return new AddressInfo("127.0.0.1",1234);
    }
    setOption(jgname:string,option:DomainOption){

    }

}

export = DomainStorage;
