import IDomainStorage = require("./IDomainStorage");
import DomainOption = require("./DomainOption");
import AddressInfo = require("../AddressInfo");

class DomainStorage implements IDomainStorage{
    constructor(){

    }
    setAddress(jgname:string,addr:AddressInfo){

    }
    getAddress(addr:string){
        return new AddressInfo("127.0.0.1",1234);
    }
    setOption(jgname:string,option:DomainOption){

    }

}

export = DomainStorage;
