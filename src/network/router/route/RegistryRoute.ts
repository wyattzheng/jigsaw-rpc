import AddressInfo = require("../../domain/AddressInfo");
import IDomainClient = require("../../domain/client/IDomainClient");
import IRoute = require("./IRoute");

class RegistryRoute implements IRoute{
    private registryClient : IDomainClient;
    private jgname : string;
    constructor(jgname:string,registryClient : IDomainClient){
        this.registryClient = registryClient;
        this.jgname = jgname;
    }
    async preload(){
        await this.registryClient.resolve(this.jgname);
    }
    async getAddressInfo() : Promise<AddressInfo>{
        let resolved = await this.registryClient.resolve(this.jgname);
        return new AddressInfo(resolved.address,resolved.port);
    }

}

export = RegistryRoute;
