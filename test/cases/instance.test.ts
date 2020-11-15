import { RPC } from "../../src/index";
import assert from "assert";

function waitForEvent(obj:any,event_name:string){
    return new Promise((resolve)=>{
        obj.once(event_name,(data:any)=>{
            resolve(data);
        });
    })
}

describe("Instance Test",()=>{
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


    after(async ()=>{
        await app.registry.close();

    })

})