import AbstractNetworkClient = require("../AbstractNetworkClient");
import Packet = require("../protocol/Packet");
import AbstractRequest = require("./AbstractRequest");
import Path = require("./Path");
import RequestState = require("./RequestState");
import BaseRequest = require("./BaseRequest")
import SimplePacketRouter = require("./packetrouter/SimplePacketRouter");
import InvokePacket = require("../protocol/packet/InvokePacket");
import InvokeReplyPacket = require("../protocol/packet/InvokeReplyPacket");
class InvokeRequest extends BaseRequest<Buffer> {
    private path : Path;
    private data : Buffer;
    private src_jgname : string;


    constructor(src_jgname: string,path : Path,data : Buffer,router : SimplePacketRouter,seq:number){
        super(router,seq);

        this.path = path;
        this.data = data;
        this.src_jgname = src_jgname;
        
        this.setState(RequestState.BUILT);
    }
    public getName(){
        return "InvokeRequest";
    }
    protected send(){
        let pk=new InvokePacket();

        pk.request_id = this.getRequestId();

        pk.data=this.data;
        pk.dst_path=this.path;
        pk.src_jgname = this.src_jgname;
        

        let router = this.router as SimplePacketRouter;
        
        router.sendPacket(this.path.jgname,pk);
    }
    protected handlePacket(p : Packet){
        if(this.state!=RequestState.PENDING)
            return;
            
        if(p.getName() == "InvokeReplyPacket"){
            let pk = p as InvokeReplyPacket;
            this.setResult(pk.data);
        }
    }
    
}

export = InvokeRequest;
