import assert from "assert";
import RPC = require("../../src/index");
import BaseNetworkClient = require("../../src/network/BaseNetworkClient");
import AddressInfo = require("../../src/network/domain/AddressInfo");
import DomainClient = require("../../src/network/domain/client/DomainClient");
import PacketFactory = require("../../src/network/protocol/factory/PacketFactory");
import SimplePacketRouter = require("../../src/network/router/packetrouter/SimplePacketRouter");
import UDPSocket = require("../../src/network/socket/UDPSocket");

function getDomainClient(socket:UDPSocket ,name:string){
    
    let client = new BaseNetworkClient(socket,new PacketFactory());

    let router = new SimplePacketRouter(client);
    let domclient = new DomainClient(name,"127.0.0.1",client.getAddressInfo().port,new AddressInfo("127.0.0.1",3793),router);

    return domclient;
}
describe("Domain Module Test",()=>{
    it("should succeed if new domain server and close immediately",async function(){
        let server = new RPC.domain.Server();
        await server.close();
    });
    it("should succeed set domain and resolve",async function(){
        let server = new RPC.domain.Server(3793);

        let port = 1234;
        let socket = new UDPSocket(port,"0.0.0.0");
        await new Promise((resolve)=>socket.once("ready",resolve));

        let client = getDomainClient(socket,"test_client");
        let addr = await client.resolve("test_client",5000);
        await server.close();
        await client.close();
        await socket.close();

        assert(addr.port == 1234,"resolved port is error");        
    });

})