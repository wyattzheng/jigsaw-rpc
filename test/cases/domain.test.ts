import assert from "assert";
import { RPC } from "../../src/index";
import UDPSocket from "../../src/network/socket/UDPSocket";
import { getRegistryResolver, getRegistryUpdater} from "./utils/GetRegistryClient";

describe("Domain Module Test",()=>{
    it("should succeed set domain and resolve",async function(){
        this.timeout(5000);
        let server = new RPC.registry.Server(3793);

        let port = 1234;
        let socket = new UDPSocket(port,"0.0.0.0");
        socket.start();
        socket.setEmitting(true);

        await new Promise((resolve)=>socket.getLifeCycle().on("ready",resolve));

        let updater = getRegistryUpdater(socket,"test_client",1234);
        await updater.getLifeCycle().when("ready");
        
        let resolver = getRegistryResolver(socket);
        await resolver.getLifeCycle().when("ready");
        let addr = await resolver.resolve("test_client",5000);

        await server.close();
        await updater.close();
        await resolver.close();
        await socket.close();
        

        assert(addr.address.port == 1234,"resolved port is error");        
    });
    it("should caught error when resolve a domain that don't exists",function(done){
        this.timeout(30000);
        let jg = RPC.GetJigsaw({name:"test",registry:"jigsaw://test-testadsdasdsadas.com"});
        let err_times = 0;

        jg.on("error",async (err)=>{
            err_times ++;
            if(err_times == 1){
                await jg.close();
                done()
            }
        })
    });
})