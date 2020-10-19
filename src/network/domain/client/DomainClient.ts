import DomainQueryPacket = require("../../protocol/packet/DomainQueryPacket");
import http = require("http");
import NetPacketRouter = require("../../request/packetrouter/NetPacketRouter");
import QueryDomainRequest = require("../../request/QueryDomainRequest");
import AddressInfo = require("../AddressInfo");
import IDomainClient = require("./IDomainClient");
import DomainUpdatePacket = require("../../protocol/packet/DomainUpdatePacket");
import Events = require("tiny-typed-emitter");


interface DomainClientEvent{
	ready: () => void;
	close: () => void;	
}


class DomainClient extends Events.TypedEmitter<DomainClientEvent> implements IDomainClient{
    private address : AddressInfo;
    private router : NetPacketRouter;
    private request_seq : number = 0;

    constructor(server_address:AddressInfo,router:NetPacketRouter){
        super();
        this.address = server_address;
        this.router = router;
        
        this.router.on("ready",()=>{
            this.emit("ready");
        });
        this.router.on("close",()=>{
            this.emit("close");
        });

    }
    resolve(jgname:string) : Promise<AddressInfo>{
        let req=new QueryDomainRequest(jgname,this.address,this.router,this.request_seq++);
        return req.run();
    }
    updateAddress(jgname:string,addrinfo:AddressInfo):void{
        let pk=new DomainUpdatePacket();
        pk.jgname=jgname;
        pk.addrinfo = addrinfo;
        
        this.router.sendPacket(pk,this.address.port,this.address.address);
    }

}

export = DomainClient;
