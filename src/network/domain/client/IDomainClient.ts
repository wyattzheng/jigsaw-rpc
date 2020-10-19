import AddressInfo = require("../AddressInfo");

interface IDomainClient{
    resolve(jgname:string) : Promise<AddressInfo>;    
}

export = IDomainClient;
