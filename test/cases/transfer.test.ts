import { RPC } from "../../src/index";
import assert from "assert";
import util from "util";
import waitForEvent  from "./utils/WaitForEvent";
import GetMockJigsaw  from "./utils/GetMockJigsaw";
import MockRandomSocket from "./mocks/MockRandomSocket";
import MockNotGoodSocket from "./mocks/MockNotGoodSocket";
import { JGError } from "../../src/spi/error";
import { count } from "console";

const sleep = util.promisify(setTimeout);

describe("Base Transfer Test",function(){
    this.timeout(10*1000);

    let app : any={};
    before(()=>{
        app.registry = new RPC.registry.Server();
    });
    
    it("should succeed when transfer a simple object",async ()=>{
        let A = RPC.GetJigsaw({name:"A"});
        let B = RPC.GetJigsaw({name:"B"});
        await Promise.all([
            waitForEvent(A,"ready"),
            waitForEvent(B,"ready")
        ]);

        A.port("call",(obj)=>{
            return obj;
        });

        let res : any = await B.send("A:call",{test:"abc123"});
        assert(res.test == "abc123");

        await A.close();
        await B.close();
    });
    it("should succeed when send itself a simple object",async function(){
        this.timeout(5000);

        let A = RPC.GetJigsaw({name:"A"});
        await waitForEvent(A,"ready"),

        A.port("call",(obj)=>{
            return obj;
        });

        let res : any = await A.send("A:call",{test:"abc123"});
        assert(res.test == "abc123");

        await A.close();
    })    

    it("should succeed when transfer an 512KB object",async function(){
        this.timeout(20*1000);

        let A = RPC.GetJigsaw({name:"A"});
        let B = RPC.GetJigsaw({name:"B"});
        await Promise.all([
            waitForEvent(A,"ready"),
            waitForEvent(B,"ready")
        ]);

        A.port("call",(obj)=>{
            return obj;
        });
        let large_object = "x".repeat(512*1024);

        let res : any = await B.send("A:call",{test:large_object});
        assert(res.test == large_object);

        await A.close();
        await B.close();        
    });

    it("should succeed when object contains a undefined",async()=>{
        
        let A = RPC.GetJigsaw({name:"A"});
        let B = RPC.GetJigsaw({name:"B"});
        await Promise.all([
            waitForEvent(A,"ready"),
            waitForEvent(B,"ready")
        ]);

        A.port("call",(obj)=>{
            return obj;
        });
        let object = {test:undefined};

        let passed = false;
        try{
            let res : any = await B.send("A:call",object);
            passed = true;
        }catch(err){
            passed = false;
        }

        await A.close();
        await B.close();        

        if(passed)
            throw new Error("should throw error");
        

    })
    it("should succeed when transfer 500 requests at the same time",async function(){
        this.timeout(20000);

        let A = RPC.GetJigsaw({name:"A"});
        let B = RPC.GetJigsaw({name:"B"});
        await Promise.all([
            waitForEvent(A,"ready"),
            waitForEvent(B,"ready")
        ]);

        A.port("call",(obj)=>{
            return obj;
        })
        let tasks = [];
        let buf = "x".repeat(10240);
        let times = 500;

        for(let i=0;i<times;i++){
            tasks.push(B.send("A:call",{buf,index:i}));
        }

        let array : Array<boolean> = [];
        let res = await Promise.all(tasks);
        for(let r of res){
            let ar = (r as any);
            if(ar.buf != buf)
                throw new Error("result is error");
            array[ar.index] = true;
        }

        assert(array.length == times);

        await A.close();
        await B.close();        
    });

    it("should succeed and won't recv same request twice when network delay",async function (){
        this.timeout(10000);

        let A = RPC.GetJigsaw({name:"A"});
        let B = RPC.GetJigsaw({name:"B"});
        await Promise.all([
            waitForEvent(A,"ready"),
            waitForEvent(B,"ready")
        ]);

        let times = 0;
        A.port("call",async (obj)=>{
            times++;
            await sleep(2000);
            return obj;
        });

        let res : any = await B.send("A:call",{test:"abc123"});
        assert(res.test == "abc123");
        assert(times == 1);

        await A.close();
        await B.close();
    });
    it("should throw the same error when remote invoke occur an error",async function(){
        this.timeout(20000);

        let A = RPC.GetJigsaw({name:"A"});
        let B = RPC.GetJigsaw({name:"B"});
        await Promise.all([
            waitForEvent(A,"ready"),
            waitForEvent(B,"ready")
        ]);

        let realError = new SyntaxError("testerrorlonglonglonglonglonglong");
        A.port("callError",(obj)=>{
            throw realError;
            return obj;
        });
        A.port("call",async (obj)=>{
            return await A.send("A:callError",{});
        })


        let error : JGError | undefined;

        try{
            let res : any = await B.send("A:call",{test:"abc123"});
        }catch(err){
            error = err;
        }
        
        
        assert(error instanceof JGError,"error must be JGError");
        
        await A.close();
        await B.close();

    });

    it("should emit error event when a malformed buffer recv from socket",(done)=>{
        let random_jg = GetMockJigsaw({},{
            Socket:MockRandomSocket
        });

        random_jg.use(async (ctx,next)=>{
            ctx.result = Math.random() + ""
            await next();
        });

        random_jg.once("error",async (err)=>{
            await random_jg.close();
            done();
        });

    });
    it("should be successfully if sending a Buffer",async ()=>{
        let A = RPC.GetJigsaw({name:"A"});
        let B = RPC.GetJigsaw({name:"B"});
        await Promise.all([waitForEvent(A,"ready"),waitForEvent(B,"ready")]);
        B.port("call",async(x)=>(x));
        let buf = await A.send("B:call",Buffer.allocUnsafe(10240));
        assert(buf instanceof Buffer);
        assert.strictEqual(buf.length,10240);
        await A.close();
        await B.close();
    });
    it("should be success in invoking in a packet-drop network",async function(){
        this.timeout(60000);

        let A = GetMockJigsaw({name:"A"},{
            Socket:MockNotGoodSocket
        });
        let B = GetMockJigsaw({name:"B"},{
            Socket:MockNotGoodSocket
        });
        B.port("call",async(x)=>(x));

        await Promise.all([waitForEvent(A,"ready"),waitForEvent(B,"ready")]);

        let success = 0;
        for(let i=0; i<10; i++){
            try{
                let rand = Math.random();
                let ret :any = await A.send("B:call",{ v: rand });
                if(ret.v == rand)  
                    success++;    
            }catch(err){

            }
        }

        assert(success>0,"the count of success is not reach the standard");

        await A.close();
        await B.close();
        
    });

    it("should be different addresses for invoking twice",async ()=>{
        let invoker = RPC.GetJigsaw();
        let provider = RPC.GetJigsaw({name:"provider"});
        await Promise.all([waitForEvent(invoker,"ready"),waitForEvent(provider,"ready")]);

        let addresses : string[] = [];
        await new Promise<void>((resolve)=>{
            provider.port("call",(data,ctx)=>{
                addresses.push(ctx.reply_info.stringify());
                if(addresses.length >= 5)
                    resolve();
            });
            for(let i=0;i<5;i++){
                invoker.send("provider:call");
            }
        });

        assert.strictEqual(new Set(addresses).size , 5 );
        await invoker.close();
        await provider.close();
    });

    it("should work well when use .usend() API to invoke jigsaw in different domain",async ()=>{
        let invoker = RPC.GetJigsaw();
        let registry_1 = new RPC.registry.Server(42001);
        let registry_2 = new RPC.registry.Server(42002);

        let provider_1 = RPC.GetJigsaw({name:"provider_1",registry:"jigsaw://127.0.0.1:42001/"});
        provider_1.port("call",(obj)=>{
            return {
                id:"1",
                obj
            };
        });

        let provider_2 = RPC.GetJigsaw({name:"provider_2",registry:"jigsaw://127.0.0.1:42002/"});
        provider_2.port("call",(obj)=>{
            return {
                id:"2",
                obj
            };
        });

        await Promise.all([
            waitForEvent(invoker,"ready"),
            waitForEvent(provider_1,"ready"),
            waitForEvent(provider_2,"ready")        
        ]);

        let res1 = await invoker.usend("jigsaw://127.0.0.1:42001/provider_1","call","1");
        
        assert.strictEqual(res1.id,"1");
        assert.strictEqual(res1.obj,"1");

        let res2 = await invoker.usend("jigsaw://127.0.0.1:42002/provider_2","call","2");
        
        assert.strictEqual(res2.id,"2");
        assert.strictEqual(res2.obj,"2");

        await invoker.close();
        await registry_1.close();
        await registry_2.close();
        await provider_1.close();
        await provider_2.close();
        
    });

    it("should behave load-balanced if jigsaws start with same name",async ()=>{
        let jgs = [];
        let jgsready = [];
        let times:any = {};

        const COUNT = 4;
        const TESTCOUNT = 100;

        for(let i=0;i<COUNT;i++){
            let jg = RPC.GetJigsaw({name:"jigsaw"});
            times[i] = 0;
            jg.port("call",()=>{
                times[i]++;
            })
            jgs.push(jg);
            jgsready.push(waitForEvent(jg,"ready"));
        }
        await Promise.all(jgsready);

        let invoker = RPC.GetJigsaw();
        await waitForEvent(invoker,"ready");

        for(let i=0;i<TESTCOUNT;i++)
            await invoker.send("jigsaw:call");
        
        
        for(let i=0;i<COUNT;i++){
            assert(times[i]> TESTCOUNT/COUNT*0.25 && times[i]< TESTCOUNT/COUNT*1.75);
        }

        for(let jg of jgs){
            await jg.close();
            await invoker.close();
        }
    })

    after(async ()=>{
        await app.registry.close();

    })

})
