import LifeCycle from "../../utils/LifeCycle";
import PurgeDomainRequest from "../../network/request/PurgeDomainRequest";
import Defer from "../../utils/Defer";
import AddressInfo from "../AddressInfo";
import IRouter from "../../network/router/IRouter";
import DomainUpdatePacket from "../../network/protocol/packet/DomainUpdatePacket";
import NetRoute from "../../network/router/route/NetRoute";
import { TypedEmitter } from "tiny-typed-emitter";
import { IRegistryUpdater, UpdaterEvent } from "./IRegistryUpdater";

import Util from "util";
import assert from 'assert';

const debug = require("debug")("DomainClient");
const sleep = Util.promisify(setTimeout);


class RegistryUpdater extends TypedEmitter<UpdaterEvent> implements IRegistryUpdater{
    private ref : number = 0;
    private closing_defer = new Defer<void>();
    private client_id = "";
    private client_name = "";
    private server_address : AddressInfo;
    private lifeCycle = new LifeCycle();
    private router : IRouter;
    private loop = false;
    private entry : AddressInfo;
    private isAnonymous = false;

    constructor(client_id:string,client_name:string,entry:AddressInfo,server_address:AddressInfo,router:IRouter){
        super();
        this.client_id = client_id;
        this.client_name = client_name;
        this.server_address = server_address;
        this.router = router;
        this.entry = entry;
    
        if(this.client_name.length == 0)
            this.isAnonymous = true;

        this.start();
    }
    private async start(){
        assert.strictEqual(this.lifeCycle.getState(),"closed");

        this.lifeCycle.setState("starting");

        this.loop = true;
        this.start_updating_loop();

        this.lifeCycle.setState("ready");
    }
    
    private async purgeDomain(){
        if(this.isAnonymous)
            return;
            
        try{
            this.setRef(+1)
            let req = new PurgeDomainRequest(this.client_id,this.client_name,this.server_address,this.router,0);
            req.getLifeCycle().on("closed",()=>{
                this.setRef(-1);
            });

            await req.getLifeCycle().when("ready");
            await req.run();
        }catch(err){

        }finally{

        }
    }
    private async start_updating_loop(){
        
        let tick = 0;
        let loop_interval = 1;
        let update_per_loops = 10*1000;

        this.setRef(+1);
        this.loop = true;
		while(this.loop == true){
            
            if(tick % update_per_loops == 0){
                try{
                    await this.updateAddress(this.client_name,this.isAnonymous? undefined : this.entry);

                }catch(err){
                    this.emit("error",err);
                }
            }

             await sleep(loop_interval);
             tick++;
        }
        this.setRef(-1);        
    }

    private async updateAddress(jgname:string,addrinfo?:AddressInfo):Promise<void>{
        let pk=new DomainUpdatePacket();

        pk.jgid = this.client_id;
        pk.jgname=jgname;
    
        if(addrinfo)
            pk.addrinfo = addrinfo;
        else
            pk.can_update = false;
        

        await this.router.sendPacket(pk,new NetRoute(this.server_address.port,this.server_address.address));

    }


    private setRef(offset:number){
        this.ref+=offset;
        if(this.lifeCycle.getState() == "closing" && this.ref == 0){
            
            this.closing_defer.resolve();
        }
    }

    public getLifeCycle(){
        return this.lifeCycle;
    }
    public async close(){
        assert.strictEqual(this.lifeCycle.getState(),"ready");

        this.loop = false;
        this.lifeCycle.setState("closing");
        await this.purgeDomain();
        this.setRef(0);
        await this.closing_defer.promise;
        this.lifeCycle.setState("closed");
    }
}

export default RegistryUpdater;
