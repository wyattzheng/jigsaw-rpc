import assert from "assert";
import { RPC } from "../../src/index";
import BaseNetworkClient from "../../src/network/client/BaseNetworkClient";
import AddressInfo from "../../src/network/domain/AddressInfo";
import RegistryClient from "../../src/network/domain/client/RegistryClient";
import RegistryServerInfo from "../../src/network/domain/RegistryServerInfo";
import PacketFactory from "../../src/network/protocol/factory/PacketFactory";
import SimplePacketRouter from "../../src/network/router/packetrouter/SimplePacketRouter";
import UDPSocket from "../../src/network/socket/UDPSocket";
import RandomGen from "../../src/utils/RandomGen";

function getRegistryClient(socket:UDPSocket ,name:string){
    
    let client = new BaseNetworkClient(socket,new PacketFactory());

    let router = new SimplePacketRouter(client);
    let port = client.getAddressInfo().port;
    let domclient = new RegistryClient(RandomGen.GetRandomHash(8),name,new AddressInfo("127.0.0.1",port),new RegistryServerInfo("jigsaw","127.0.0.1",3793),router);

    return domclient;
}
describe("Domain Module Test",()=>{
    it("should succeed set domain and resolve",async function(){
        this.timeout(5000);
        let server = new RPC.registry.Server(3793);

        let port = 1234;
        let socket = new UDPSocket(port,"0.0.0.0");
        socket.start();

        await new Promise((resolve)=>socket.getLifeCycle().on("ready",resolve));

        let client = getRegistryClient(socket,"test_client");
        await client.getLifeCycle().when("ready");
        let addr = await client.resolve("test_client",5000);
        await server.close();
        await client.close();
        await socket.close();
        

        assert(addr.addr.port == 1234,"resolved port is error");        
    });

})