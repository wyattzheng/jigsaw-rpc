import AddressInfo = require("../AddressInfo");

interface IDomainClient{
    getState():string;
    resolve(jgname:string) : Promise<AddressInfo>;    
    updateAddress(jgname:string,addr:AddressInfo) : void;
    close() : void;
}

export = IDomainClient;
