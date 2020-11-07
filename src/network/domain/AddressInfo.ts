class AddressInfo{
    public address:string = "";
    public port:number = -1;
    constructor(address:string,port:number){
        this.address=address;
        this.port=port;
    }
    static parse(path:string){
        if(path.indexOf(":") == -1)
            return new AddressInfo(path,-1);

        let [address,strport] = path.split(":");
        return new AddressInfo(address,parseInt(strport));
    }

}

export default AddressInfo;