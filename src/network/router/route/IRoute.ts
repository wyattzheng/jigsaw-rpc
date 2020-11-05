import AddressInfo = require("../../domain/AddressInfo");

interface IRoute{
    preload(): Promise<void>;
    getAddressInfo() : Promise<AddressInfo>;
}

export = IRoute;
