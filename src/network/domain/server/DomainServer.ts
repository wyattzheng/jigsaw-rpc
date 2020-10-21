import BuilderNetworkClient = require("../../BuilderNetworkClient");
import UDPSocket = require("../../socket/UDPSocket");
import PacketBuilderManager = require("../../protocol/builder/manager/PacketBuilderManager");
import PacketFactory = require("../../protocol/factory/PacketFactory");
import NetRequestRouter = require("../../request/packetrouter/NetPacketRouter");
import Packet = require("../../protocol/Packet");
import DomainHandler = require("../../handler/DomainHandler");
import { TypedEmitter } from "tiny-typed-emitter";
interface DomainServerEvent{
    ready:()=>void;
    close:()=>void;
}
class DomainServer extends TypedEmitter<DomainServerEvent>{
    private address:string;
    private port:number;
    private router:NetRequestRouter;
    private client : BuilderNetworkClient;
    private socket : UDPSocket;
    private handler : DomainHandler;
    private state : string = "close";

    constructor(bind_port:number,bind_address:string){
        super();

        this.address = bind_address;
        this.port = bind_port;

        let factory = new PacketFactory();
        let builder_manager = new PacketBuilderManager(factory);

        this.socket = new UDPSocket(this.port,this.address);
        this.client = new BuilderNetworkClient(this.socket,factory,builder_manager);
        
        this.router = new NetRequestRouter(this.client,-1,"No a valid destination"); 

        this.handler = new DomainHandler(this.router);

        this.socket.on("ready",()=>{
            this.state="ready";
            this.emit("ready");
        })
        
        this.socket.on("close",()=>{
            this.state="close";
            this.emit("close");
        })

    }
    close(){
        this.socket.close();
    }

}

export = DomainServer;