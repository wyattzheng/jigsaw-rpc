import AddressInfo from "../../domain/AddressInfo";
import { IRegistryResolver } from "../../domain/client/IRegistryResolver";
import IRoute from "./IRoute";
import { DnsResolve4 } from "../../../utils/DnsResolver";

class RegistryRoute implements IRoute{
    private resolver : IRegistryResolver;
    private regpath : string;
    constructor(regpath:string,resolver : IRegistryResolver){
        this.resolver = resolver;
        this.regpath = regpath;
    }
    async preload(){
        await this.resolver.resolve(this.regpath);
    }
    async getAddressInfo() : Promise<AddressInfo>{
        
        let resolved = await this.resolver.resolve(this.regpath);
        
        let dst_addr = await DnsResolve4(resolved.address.address);
        return new AddressInfo(dst_addr,resolved.address.port);
    }

}

export default RegistryRoute;
