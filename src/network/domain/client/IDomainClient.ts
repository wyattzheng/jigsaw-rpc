import AddressInfo = require("../AddressInfo");

interface IDomainClient{
    resolve(jgname:string,onlycache?:boolean) : Promise<AddressInfo>;    
    updateAddress(jgname:string,addr:AddressInfo) : void;
    close() : void;
}

export = IDomainClient;
