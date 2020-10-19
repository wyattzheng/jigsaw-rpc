import AddressInfo = require("../AddressInfo");
import DomainOption = require("./DomainOption");

interface IDomainStorage{
    setAddress(jgname:string,addrinfo:AddressInfo) : void;
    getAddress(jgname:string):AddressInfo;
    setOption(jgname:string,option:DomainOption):void;

}


export = IDomainStorage;
