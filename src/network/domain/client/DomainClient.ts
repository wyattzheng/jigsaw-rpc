import DomainQueryPacket = require("../../protocol/packet/DomainQueryPacket");
import http = require("http");
import NetRequestSwitch = require("../../request/router/NetRequestSwitch");
import QueryDomainRequest = require("../../request/QueryDomainRequest");
import AddressInfo = require("../AddressInfo");

class DomainClient{
    private address : string;
    private rswitch : NetRequestSwitch;
    private seq : number = 0; 
    constructor(server_address:string,rswitch:NetRequestSwitch){
        this.address = server_address;
        this.rswitch = rswitch;
        
    }
    resolve(jgname:string) : Promise<AddressInfo>{
        let req=new QueryDomainRequest(jgname,this.rswitch);
        return req.run();
    }


}

export = DomainClient;
