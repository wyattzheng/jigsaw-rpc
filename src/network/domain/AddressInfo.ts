class AddressInfo{
    public address:string = "";
    public port:number = -1;
    constructor(address:string,port:number){
        this.address=address;
        this.port=port;
    }
}

export = AddressInfo;