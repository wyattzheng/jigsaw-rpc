import NetPacketRouter = require("../../request/packetrouter/NetPacketRouter");
import QueryDomainRequest = require("../../request/QueryDomainRequest");
import AddressInfo = require("../AddressInfo");
import IDomainClient = require("./IDomainClient");
import DomainUpdatePacket = require("../../protocol/packet/DomainUpdatePacket");
import Events = require("tiny-typed-emitter");
import util = require("util");
import LimitedMap = require("../../../utils/LimitedMap");
import Defer = require("../../../utils/Defer");
const debug = require("debug")("DomainClient");

const sleep = util.promisify(setTimeout);


interface DomainClientEvent{
	ready: () => void;
	close: () => void;	
}

class DomainCache{
    public addrinfo : AddressInfo;
    public createTime : number = new Date().getTime();
    public expired : number;
    constructor(addrinfo : AddressInfo,expired : number = 10 * 1000){
        this.addrinfo = addrinfo;
        this.expired = expired;
    }
    isExpired() : boolean{
        let alive = this.createTime + this.expired - new Date().getTime();
        return alive < 0;
    }
}

class DomainClient extends Events.TypedEmitter<DomainClientEvent> implements IDomainClient{
    private address : AddressInfo;
    private router : NetPacketRouter;
    private request_seq : number = 0;
    private state : string = "close";
    private client_name : string;
    private entry_address : string ;
    private loop : boolean = false;
    private cache = new LimitedMap<string,DomainCache>(1000);
    private closing_defer = new Defer<void>();

    constructor(client_name:string,entry_address:string,server_address:AddressInfo,router:NetPacketRouter){
        super();
        this.address = server_address;
        this.router = router;
        this.client_name = client_name;
        this.entry_address = entry_address;

        this.router.on("ready",()=>{
            this.start_updating_loop();
            this.state = "ready";
            this.emit("ready");
        });
        this.router.on("close",()=>{
            this.close();
        });

    }
    private getAddress() : AddressInfo{
        let client = this.router.getClient();
        let socket = client.getSocket();
        return socket.getAddress();
    }
	public async start_updating_loop(){
        
        let tick = 0;
        let loop_interval = 100;

        this.loop = true;
		while(this.loop == true){
            let tick_time = Math.floor((tick * loop_interval) / 1000);
            if(tick_time % 10 == 0){
                let addr = this.getAddress();
                let update_addr = new AddressInfo(this.entry_address,addr.port);
                //console.log("update",update_addr);
                try{
                    this.updateAddress(this.client_name,update_addr);

                }catch(err){
                    console.error("updating address error",err);
                }
            }
             await sleep(loop_interval);
             tick++;
        }
        
        this.closing_defer.resolve();
        this.state = "close";
        this.emit("close");
    }
    async close(){
        if(this.state == "closing" || this.state =="close")
            return;
        if(this.state != "ready")
            throw new Error("at this state, instance can not close");

        this.state = "closing";
        this.loop = false;
        await this.closing_defer.promise;
    }
    async resolve(jgname:string,onlycache = false,timeout:number = 5000) : Promise<AddressInfo>{
        if(this.cache.has(jgname)){
            let cache = this.cache.get(jgname) as DomainCache;
            
            if(!cache.isExpired()) // meet cache
                return cache.addrinfo;
            
        }else{
            if(onlycache)
                throw new Error("dont have this address cache")
        }

        

        let addrinfo = await this.doResolve(jgname,timeout);
        debug("real resolve",jgname,addrinfo);


        this.cache.set(jgname,new DomainCache(addrinfo));

        return addrinfo;
    }
    private async doResolve(jgname:string,timeout:number){
        let start_time = new Date().getTime();
        let loop_interval = 200;
        let max_time = 10*1000;
        
        let loops = Math.floor(max_time / loop_interval);

        for(let i=0;i<loops;i++){
            try{
                let req=new QueryDomainRequest(jgname,this.address,this.router,this.request_seq++);
                await req.whenBuild();
                await req.run();
                return req.getResult();   

            }catch(err){

            }
            let time=new Date().getTime();

            if(time - start_time > timeout)
                break;
            
            await sleep(loop_interval);
        }
        throw new Error("resolve reach its max retry time");
        
    }
    updateAddress(jgname:string,addrinfo:AddressInfo):void{
        let pk=new DomainUpdatePacket();
        pk.jgname=jgname;
        pk.addrinfo = addrinfo;
        
        this.router.sendPacket(pk,this.address.port,this.address.address);
    }

}

export = DomainClient;
