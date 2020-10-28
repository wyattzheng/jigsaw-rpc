import BaseNetworkClient from "../../src/network/BaseNetworkClient"
import AddressInfo from "../../src/network/domain/AddressInfo"
import DomainClient from "../../src/network/domain/client/DomainClient"
import PacketBuilder from "../../src/network/protocol/builder/PacketBuilder"
import PacketFactory from "../../src/network/protocol/factory/PacketFactory"
import BaseRequest from "../../src/network/request/BaseRequest"
import InvokeRequest from "../../src/network/request/InvokeRequest"
import NetPacketRouter from "../../src/network/request/packetrouter/NetPacketRouter"
import SimplePacketRouter from "../../src/network/request/packetrouter/SimplePacketRouter"
import Path from "../../src/network/request/Path"
import UDPSocket from "../../src/network/socket/UDPSocket"


function getDomainClient(socket:UDPSocket ,name:string){
    
    let client = new BaseNetworkClient(socket,new PacketFactory());

    let router = new NetPacketRouter(client);
    let domclient = new DomainClient(name,"127.0.0.1",new AddressInfo("127.0.0.1",3793),router);

    return domclient;
}
class TestRequest extends BaseRequest<void>{
    
    getName(){
        return "";
    }
    async send(){
        
    }
    handlePacket(){

    }

}
describe("Request Test",()=>{
    it("should timeout when never build a new request",(done)=>{

        let socket = new UDPSocket();
        let client = new BaseNetworkClient(socket,new PacketFactory());

        let router = new NetPacketRouter(client);
    
        new NetPacketRouter(client)
        let req = new TestRequest(router,0,1000);
        let ref = 0;
        req.on("built",(err)=>{
            ++ref;
        });
        req.on("done",async (err)=>{
            if(++ref == 2){
                
                await socket.close();
                done();
            }
        });
    });
})