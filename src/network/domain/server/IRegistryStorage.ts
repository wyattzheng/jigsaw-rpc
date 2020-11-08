import AddressInfo from "../AddressInfo";

interface IRegistryStorage{
    setAddress(jgname:string,addrinfo:AddressInfo) : void;
    getAddress(jgname:string):AddressInfo;
 
}


export default IRegistryStorage;
