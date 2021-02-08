import { RPC } from "../../src/index";
import assert from "assert";
import waitForEvent from "./utils/WaitForEvent";

describe("Instance Test",function(){
    this.timeout(10*1000);

    let app : any={};
    before(()=>{
        app.registry = new RPC.registry.Server();
    });

    it("should throw error when closing instance immediately to a new jigsaw",async ()=>{
        let jg = RPC.GetJigsaw({name:"A"});
        let error = false;
        let ready = waitForEvent(jg,"ready");
        try{
            await jg.close();
        }catch(err){
            error = true;
        }
        await ready;
        await jg.close();
        assert(error, "must throw a error");
    });

    it("should be successful if create same name jigsaw twice",async ()=>{
        let invoker = RPC.GetJigsaw();
        let jg = RPC.GetJigsaw({name:"jigsaw"});
        jg.port("get",async ()=>{
            return 123;
        });
        await waitForEvent(jg,"ready");
        assert.strictEqual(await invoker.send("jigsaw:get",{}),123);
        await jg.close();

        jg = RPC.GetJigsaw({name:"jigsaw"});
        await waitForEvent(jg,"ready");
        jg.port("get",async ()=>{
            return 456;
        });
        assert.strictEqual(await invoker.send("jigsaw:get",{}),456);

        await jg.close();
        await invoker.close();
    });
    it("should throw error if send to a malformed path",async ()=>{
        let jg = RPC.GetJigsaw({name:"jigsaw"});
        jg.port("get",async ()=>{
            return 123;
        });
        await waitForEvent(jg,"ready");

        let hasError = false;
        try{
            await jg.send("malformed,get",{});
        }catch(err){
            hasError = true;
        }
        assert(hasError,"must throw error");
        
        await jg.close();
    })


    after(async ()=>{
        await app.registry.close();

    })

})