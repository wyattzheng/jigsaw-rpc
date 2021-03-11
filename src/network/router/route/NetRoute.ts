import AddressInfo from "../../../domain/AddressInfo";
import IRoute from "./IRoute";
import { DnsResolve4 } from "../../../utils/DnsResolver";

class NetRoute implements IRoute{
    private dst_port : number;
    private dst_address : string;
    
    constructor(dst_port:number,dst_address:string){
        this.dst_port = dst_port;
        this.dst_address = dst_address;
    }
    async preload(){

    }
    async getAddressInfo() : Promise<AddressInfo>{
        
        let dst_addr = await DnsResolve4(this.dst_address);
        return new AddressInfo(dst_addr,this.dst_port);
    }
}

export default NetRoute;