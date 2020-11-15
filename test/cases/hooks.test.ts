import assert from "assert";
import { RPC } from "../../src/index";
import waitForEvent from "./utils/WaitForEvent";

describe("Jigsaw Hooks Test",function(){
    let app : any={};
    before(()=>{
        app.registry = new RPC.registry.Server();
    });

    it("should be successful to redirect to jigsaw itself if use pre hook",async ()=>{

        let remote = RPC.GetJigsaw({name:"remote"});
        remote.port("get",async()=>{
            return 123;
        });

        let invoker = RPC.GetJigsaw();
        await waitForEvent(invoker,"ready");
        assert.strictEqual(await invoker.send("remote:get",{}),123);

        
        invoker.pre(async (ctx,next)=>{
            ctx.route = {
                preload(){

                },
                getAddressInfo(){
                    return invoker.getAddress();
                }
            }
            await next();
        });
        invoker.port("get",async()=>{
            return 456;
        });

        assert.strictEqual(await invoker.send("remote:get",{}),456);
      
        await invoker.close();
        await remote.close();
    });
    it("should be successful if modify jigsaw invoking result",async()=>{
        let remote = RPC.GetJigsaw({name:"remote"});
        let invoker = RPC.GetJigsaw();

        remote.use(async(ctx,next)=>{

            await next();
            if(ctx.data.msg == "hello")
                ctx.result.msg = "hacked";
        })
        remote.port("get",()=>{
            return { msg : "hello,too" };
        });

        await Promise.all([waitForEvent(remote,"ready"),waitForEvent(invoker,"ready")]);

        let result : any = await invoker.send("remote:get",{ msg:"hello" });
        assert.strictEqual(result.msg,"hacked");
        
        let result2 : any = await invoker.send("remote:get",{ msg:"hello?" });
        assert.strictEqual(result2.msg,"hello,too");
        
        await invoker.close();
        await remote.close();
    })

    after(async ()=>{
        await app.registry.close();

    })

});