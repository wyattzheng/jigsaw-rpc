import AddressInfo from "../AddressInfo";
import DomainOption from "./DomainOption";

interface IDomainStorage{
    setAddress(jgname:string,addrinfo:AddressInfo) : void;
    getAddress(jgname:string):AddressInfo;
    setOption(jgname:string,option:DomainOption):void;

}


export default IDomainStorage;
