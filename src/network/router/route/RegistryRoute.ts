import AddressInfo from "../../domain/AddressInfo";
import IRegistryClient from "../../domain/client/IRegistryClient";
import IRoute from "./IRoute";
import { DnsResolve4 } from "../../../utils/DnsResolver";

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
        
        let dst_addr = await DnsResolve4(resolved.address.address);
        return new AddressInfo(dst_addr,resolved.address.port);
    }

}

export default RegistryRoute;
