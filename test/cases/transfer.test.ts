import { RPC } from "../../src/index";
import assert from "assert";
import util from "util";
import waitForEvent  from "./utils/WaitForEvent";
import GetMockJigsaw  from "./utils/GetMockJigsaw";
import MockRandomSocket from "./mocks/MockRandomSocket";
import MockNotGoodSocket from "./mocks/MockNotGoodSocket";
import { JGError } from "../../src/spi/error";

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

    after(async ()=>{
        await app.registry.close();

    })

})
