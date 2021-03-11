import AddressInfo from "../../../domain/AddressInfo";

interface IRoute{
    preload(): Promise<void>;
    getAddressInfo() : Promise<AddressInfo>;
}

export default IRoute;
