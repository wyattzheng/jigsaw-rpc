import BuilderNetworkClient from "../../client/BuilderNetworkClient";
import INetworkClient from "../../client/INetworkClient";
import UDPSocket from "../../socket/UDPSocket";
import PacketBuilderManager from "../../protocol/builder/manager/PacketBuilderManager";
import PacketFactory from "../../protocol/factory/PacketFactory";
import DomainHandler from "../../handler/DomainHandler";
import { TypedEmitter } from "tiny-typed-emitter";
import SimplePacketRouter from "../../router/packetrouter/SimplePacketRouter";
import IRouter from "../../router/IRouter";
import assert from "assert";

interface DomainServerEvent{
    ready:()=>void;
    closed:()=>void;
}

class DomainServer extends TypedEmitter<DomainServerEvent>{
    private address:string;
    private port:number;
    private router:IRouter;
    private client : INetworkClient;
    private socket : UDPSocket;
    private handler : DomainHandler;

    constructor(bind_port?:number,bind_address?:string){
        super();

        this.address = bind_address || "0.0.0.0";
        this.port = bind_port || 3793;

        let factory = new PacketFactory();
        let builder_manager = new PacketBuilderManager(factory);

        this.socket = new UDPSocket(this.port,this.address);
        this.socket.start();

        this.client = new BuilderNetworkClient(this.socket,factory,builder_manager);
        
        this.router = new SimplePacketRouter(this.client); 

        this.handler = new DomainHandler(this.router);

        this.socket.getLifeCycle().on("ready",()=>{
            this.emit("ready");
        })
        
        this.socket.getLifeCycle().on("closed",()=>{
            this.emit("closed");
        });

    }
    getLifeCycle(){
        return this.socket.getLifeCycle();
    }
    getStorage(){
        return this.handler.storage;
    }
    async close(){
        let state = this.getLifeCycle().getState();
        assert.strictEqual(state,"ready");

        await this.handler.close();
        await this.router.close();
        await this.socket.close();

    }

}

export default DomainServer;