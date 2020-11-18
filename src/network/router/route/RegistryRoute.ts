import AddressInfo from "../../domain/AddressInfo";
import IRegistryClient from "../../domain/client/IRegistryClient";
import IRoute from "./IRoute";

class RegistryRoute implements IRoute{
    private registryClient : IRegistryClient;
    private regpath : string;
    constructor(regpath:string,registryClient : IRegistryClient){
        this.registryClient = registryClient;
        this.regpath = regpath;
    }
    async preload(){
        await this.registryClient.resolve(this.regpath);
    }
    async getAddressInfo() : Promise<AddressInfo>{
        let resolved = await this.registryClient.resolve(this.regpath);
        
        return new AddressInfo(resolved.address.address,resolved.address.port);
    }

}

export default RegistryRoute;
