import RPC = require("../../src/index");
import assert = require("assert");

function waitForEvent(obj:any,event_name:string){
    return new Promise((resolve)=>{
        obj.once(event_name,(data:any)=>{
            resolve(data);
        });
    })
}

describe("Base Transfer Test",()=>{
    let app : any={};
    before(()=>{
        app.registry = new RPC.domain.Server();
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
    it("should succeed when send itself a simple object",async()=>{
        let A = RPC.GetJigsaw({name:"A"});
        await waitForEvent(A,"ready"),

        A.port("call",(obj)=>{
            return obj;
        });

        let res : any = await A.send("A:call",{test:"abc123"});
        assert(res.test == "abc123");

        await A.close();
    })    

    it("should succeed when transfer an 1MB object",async function(){
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
        let large_object = "x".repeat(1024*1024);

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

    after(async ()=>{
        await app.registry.close();

    })

})
