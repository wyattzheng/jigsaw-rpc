import Url from "url";
import FormatError from "../error/FormatError";

class RegistryServerInfo{
    public address:string = "";
    public port:number = -1;
    public protocol:string = "";

    constructor(protocol:string,address:string,port:number){
        this.protocol = protocol;
        this.address = address;
        this.port = port;
    }
    stringify(){
        return `${this.protocol}//${this.address}:${this.port}/`;
    }
    static parse(path:string){
        let parsed = Url.parse(path);
        let portnum = 3793;
        if(parsed.port != null)
            portnum = parseInt(parsed.port);

        let hostname = "127.0.0.1";
        if(parsed.hostname != null)
            hostname = parsed.hostname;

        if(parsed.protocol == null)
            throw new FormatError("must specified a protocol");

        return new RegistryServerInfo(parsed.protocol,hostname,portnum);

    }

}

export default RegistryServerInfo;