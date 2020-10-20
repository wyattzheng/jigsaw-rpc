import DomainQueryPacket = require("../../protocol/packet/DomainQueryPacket");
import http = require("http");
import NetPacketRouter = require("../../request/packetrouter/NetPacketRouter");
import QueryDomainRequest = require("../../request/QueryDomainRequest");
import AddressInfo = require("../AddressInfo");
import IDomainClient = require("./IDomainClient");
import DomainUpdatePacket = require("../../protocol/packet/DomainUpdatePacket");
import Events = require("tiny-typed-emitter");
import util = require("util");
import { start } from "repl";

const sleep = util.promisify(setTimeout);


interface DomainClientEvent{
	ready: () => void;
	close: () => void;	
}


class DomainClient extends Events.TypedEmitter<DomainClientEvent> implements IDomainClient{
    private address : AddressInfo;
    private router : NetPacketRouter;
    private request_seq : number = 0;
    private state : string = "close";
    private client_name : string;
    private entry_address : string ;
    private loop : boolean = false;
    constructor(client_name:string,entry_address:string,server_address:AddressInfo,router:NetPacketRouter){
        super();
        this.address = server_address;
        this.router = router;
        this.client_name = client_name;
        this.entry_address = entry_address;

        this.router.on("ready",()=>{
            this.state = "ready";
            this.emit("ready");
            this.start_updating_loop();
        });
        this.router.on("close",()=>{
            this.state = "close";
            this.emit("close");
        });

    }
    private getAddress() : AddressInfo{
        let client = this.router.getClient();
        let socket = client.getSocket();
        return socket.getAddress();
    }
	public async start_updating_loop(){
        
        this.loop = true;
		while(this.loop == true){
            
            let addr = this.getAddress();
            let update_addr = new AddressInfo(this.entry_address,addr.port);

            console.log("update",update_addr);
            try{
                this.updateAddress(this.client_name,update_addr);

            }catch(err){
                console.error("updating address error",err);
            }
 			await sleep(10*1000);
		}
        this.router.close();
        
    }
    close(){
        this.loop = false;
    }
    resolve(jgname:string,timeout:number = 5000) : Promise<AddressInfo>{
        
        return this.doResolve(jgname,timeout);
    }
    private async doResolve(jgname:string,timeout:number){
        let start_time = new Date().getTime();
        for(let i=0;i<5;i++){
            try{
                let req=new QueryDomainRequest(jgname,this.address,this.router,this.request_seq++);
                return await req.run();    
            }catch(err){

            }
            let time=new Date().getTime();

            if(time - start_time > timeout)
                break;
            
            await sleep(200);
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
