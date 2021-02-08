import BaseNetworkClient from "../../src/network/client/BaseNetworkClient"
import PacketFactory from "../../src/network/protocol/factory/PacketFactory"
import BaseRequest from "../../src/network/request/BaseRequest"
import SimplePacketRouter from "../../src/network/router/packetrouter/SimplePacketRouter"
import UDPSocket from "../../src/network/socket/UDPSocket"


class TestRequest extends BaseRequest<void>{
    
    getName(){
        return "";
    }
    async send(){
        
    }
    async handlePacket(){

    }

}
describe("Request Test",()=>{
    it("should timeout when never build a new request",(done)=>{

        let socket = new UDPSocket();
        socket.start();
        socket.setEmitting(true);

        
        let client = new BaseNetworkClient(socket,new PacketFactory());

        let router = new SimplePacketRouter(client);

        let req = new TestRequest(router,0,1000);
        let ref = 0;
        req.getLifeCycle().on("closed",async ()=>{
            ++ref;
        });
        
        req.getLifeCycle().on("dead",async ()=>{
            if(++ref == 2){
                await client.close();
                await socket.close();
                done();
            }
        });


    });
})