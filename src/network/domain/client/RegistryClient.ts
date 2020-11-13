import AddressInfo from "../AddressInfo";
import IRegistryClient from "./IRegistryClient";
import IRouter from "../../router/IRouter";
import LifeCycle from "../../../utils/LifeCycle";
import DomainClientHandler from "../../../network/handler/DomainClientHandler";
import RegistryServerInfo from "../RegistryServerInfo";
import RegistryResolver from "./RegistryResolver";
import RegistryUpdater from "./RegistryUpdater";




class RegistryClient implements IRegistryClient{
    private router : IRouter;
    private client_id : string;
    private client_name : string;
    private updater : RegistryUpdater;
    private resolver : RegistryResolver;

    private handler : DomainClientHandler;
    private lifeCycle = new LifeCycle();

    constructor(
        client_id:string,
        client_name:string,
        entry:AddressInfo,
        server_address:RegistryServerInfo,
        router:IRouter){
        
        this.router = router;
        this.client_id = client_id;
        this.client_name = client_name;


        this.updater = new RegistryUpdater(this.client_id,this.client_name,entry,server_address,this.router);
        this.resolver = new RegistryResolver(server_address,this.router);

        this.handler = new DomainClientHandler(this.router);


        this.lifeCycle.setState("starting");

        this.handler.getEventEmitter().on("domain_purged",this.handlePurgedEvent.bind(this));
        this.router.getLifeCycle().when("ready").then(this.start.bind(this));
        
    }
    public resolve(jgname : string,timeout:number = 5000){
        return this.resolver.resolve(jgname,timeout);
    }
    public getLifeCycle(){
        return this.lifeCycle;
    }
    private handlePurgedEvent(jgid:string){
        this.resolver.getCache().clearCached_jgid(jgid);
    }
    private start(){
        this.updater.start();
        this.lifeCycle.setState("ready");
    }
    async close(){
        if(this.lifeCycle.getState() == "closing" || this.lifeCycle.getState() =="closed")
            return;
        if(this.lifeCycle.getState() != "ready")
            throw new Error("at this state, instance can not close");
        

        this.lifeCycle.setState("closing");

        await this.updater.purgeDomain();
        await this.handler.close();

        await this.updater.close();
        await this.resolver.close();

        this.lifeCycle.setState("closed");
    }

}

export default RegistryClient;
