import AbstractNetworkClient = require("../AbstractNetworkClient");
import Packet = require("../protocol/Packet");
import AbstractRequest = require("./AbstractRequest");
import Path = require("./Path");
import RequestState = require("./RequestState");
import BaseRequest = require("./BaseRequest")
import SimpleRequestSwitch = require("./switch/SimpleRequestSwitch");
import InvokePacket = require("../protocol/packet/InvokePacket");
class InvokeRequest extends BaseRequest<Buffer> {
    private path : Path;
    private data : Buffer;
    private src_jgname : string;


    constructor(src_jgname: string,path : Path,data : Buffer,rswitch : SimpleRequestSwitch){
        super(rswitch);

        this.path = path;
        this.data = data;
        this.src_jgname = src_jgname;
        
        this.setState(RequestState.BUILT);
    }
    protected send(){
        let pk=new InvokePacket();

        pk.request_id = this.getRequestId();

        pk.data=this.data;
        pk.dst_path=this.path;
        pk.src_jgname = this.src_jgname;

        let rswitch = this.rswitch as SimpleRequestSwitch;
        rswitch.sendPacket(this.path.jgname,pk);
    }
    protected handlePacket(p : Packet){
        if(p.getName() == "InvokeReplyRequest"){
            
            
        }else
            throw new Error("recved an unknown packet")

    }
    
}

export = InvokeRequest;
