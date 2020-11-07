import AddressInfo from "../../domain/AddressInfo";
import IRoute from "./IRoute";

class NetRoute implements IRoute{
    private dst_port : number;
    private dst_address : string;
    
    constructor(dst_port:number,dst_address:string){
        this.dst_port = dst_port;
        this.dst_address = dst_address;
    }
    async preload(){
        throw new Error("this route can not preload");
    }
    async getAddressInfo() : Promise<AddressInfo>{
        return new AddressInfo(this.dst_address,this.dst_port);
    }
}

export default NetRoute;