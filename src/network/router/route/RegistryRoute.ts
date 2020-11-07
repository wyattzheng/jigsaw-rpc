import AddressInfo from "../../domain/AddressInfo";
import IDomainClient from "../../domain/client/IDomainClient";
import IRoute from "./IRoute";

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

export default RegistryRoute;
