import NetPacketRouter = require("../request/packetrouter/NetPacketRouter");
import AbstractHandler = require("./AbstractHandler");
import Packet = require("../protocol/Packet");
import DomainReplyPacket = require("../protocol/packet/DomainReplyPacket");
import DomainQueryPacket = require("../protocol/packet/DomainQueryPacket");
import DomainStorage = require("../domain/server/DomainStorage");
import DomainUpdatePacket = require("../protocol/packet/DomainUpdatePacket");
import ErrorPacket = require("../protocol/packet/ErrorPacket");
import SimplePacketRouter = require("../request/packetrouter/SimplePacketRouter");
import { TypedEmitter } from "tiny-typed-emitter";
import InvokePacket = require("../protocol/packet/InvokePacket");
import InvokeReplyPacket = require("../protocol/packet/InvokeReplyPacket");
import Path = require("../request/Path");
import InvokeRequest = require("../request/InvokeRequest");

type Handler = (path:Path,buf:Buffer)=>Promise<Buffer>;

class InvokingError extends Error{}

class InvokeHandler extends AbstractHandler{
    public router : NetPacketRouter;
    public handler : Handler;

    private invoke_result? : Packet;
    private invoked : boolean = false;

    private invoking : boolean = false;

    constructor(router:NetPacketRouter,handler:Handler){
        super(router);
        this.router = router;
        this.handler = handler;

        this.router.plug("InvokePacket",this.handlePacket.bind(this));
        
    }
    protected async getResponsePacket(p:Packet):Promise<Packet>{
        if(p.getName() == "InvokePacket"){
            if(this.invoking){
                throw new InvokingError("request is invoking target...");
            }
            this.invoking = true;

            let pk = p as InvokePacket;

            let r_pk = new InvokeReplyPacket();

            let ret_data = await this.handler(pk.dst_path,pk.data);

            r_pk.request_id = pk.request_id;
            r_pk.data = ret_data;


            return r_pk;
        }else
            throw new Error("not a correct packet");
    }
    protected async handlePacket(p:Packet){
        if(this.invoked){            
            this.router.sendPacket(this.invoke_result as Packet,p.reply_info.port,p.reply_info.address);
            return;
        }
        
            
        try{
            this.invoke_result = await this.getResponsePacket(p);

        }catch(err){
            if(err instanceof InvokingError)
                return;

            let pk=new ErrorPacket();
            pk.error = err;
            pk.request_id = p.request_id;

            this.invoke_result = pk;
            
        }
        this.invoked = true;
        this.router.sendPacket(this.invoke_result as Packet,p.reply_info.port,p.reply_info.address);
            

    }

}

export = InvokeHandler;
