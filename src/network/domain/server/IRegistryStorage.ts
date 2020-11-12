import AddressInfo from "../AddressInfo";

interface IRegistryStorage{
    setAddress(jgid:string,jgname:string,addrinfo:AddressInfo) : void;
    getAddress(jgname:string):Array<AddressInfo>;
 
}


export default IRegistryStorage;
