import { TypedEmitter } from "tiny-typed-emitter";

import { IJigsaw,JigsawState } from "./IJigsaw";

import LifeCycle from "../utils/LifeCycle";
import RandomGen from "../utils/RandomGen";

import { JigsawOption, JigsawModuleOption } from "./JigsawOption";
import { SimpleInvoker } from "./SimpleInvoker";
import { SimpleProvider } from "./SimpleProvider";
import { PostWare, PreWare, UseWare } from "./JigsawWare";
import { UseContext } from "./context/Context";
import { NetComponent, NetFactory } from "./NetFactory";
import AddressInfo from "../domain/AddressInfo";


interface JigsawEvent{
    error:(err : Error)=>void;
    ready:()=>void;
    closed:()=>void;
}

class SimpleJigsaw extends TypedEmitter<JigsawEvent> implements IJigsaw{

    private lifeCycle = new LifeCycle();
    private modules : JigsawModuleOption;

    private jgid : string;
    private jgname : string;

    private option : JigsawOption;

    private invoker:SimpleInvoker;
    private provider:SimpleProvider;
    private public_net?:NetComponent;

    constructor(option : JigsawOption,modules : JigsawModuleOption){
        super();
        this.jgid = RandomGen.GetRandomHash(8);
        this.jgname = option.name || "";

        this.option = option;
        this.modules = modules;

        this.invoker = new SimpleInvoker(this.jgid,this.option,this.modules);
        this.provider = new SimpleProvider(this.jgid,this.option,this.modules);

        this.invoker.on("error",(err)=>this.emit("error",err));
        this.provider.on("error",(err)=>this.emit("error",err));

        this.lifeCycle.on("ready",()=>this.emit("ready"))
        this.init();
    }
    
    private async init(){
        this.lifeCycle.setState("starting");


        let factory = new NetFactory(this.modules,(err)=>this.emit("error",err));
        let socket = await factory.getNewSocket(this.option.port);
        let client = await factory.getNewClient(socket);
        let router = await factory.getNewRouter(client);
        
        this.public_net = {socket,client,router};

        this.invoker.start(this.public_net);
        this.provider.start(this.public_net);


        await Promise.all([
            this.invoker.getLifeCyle().when("ready"),
            this.provider.getLifeCyle().when("ready")
        ]);


        this.lifeCycle.setState("ready");
        
    }
    call(address:AddressInfo,path_str:string,data?: any) : Promise<any>{
        return this.invoker.call(address,path_str,data);
    }
    use(handler : UseWare,hash?:string) : void{
        return this.provider.use(handler,hash);
    }
    pre(handler : PreWare,hash?:string) : void{
        return this.invoker.pre(handler,hash);
    }
    post(handler : PostWare,hash?:string) : void{
        return this.invoker.post(handler,hash);
    }
    port(port_name : string , handler:(data:any,ctx:UseContext)=>any) : void{
        return this.provider.port(port_name,handler);
    }
    send(path_str:string,data:any = {}) : Promise<any>{
        return (this.invoker as SimpleInvoker).send(path_str,data);
    }
    usend(url:string,method:string,data:any = {}){
        return (this.invoker as SimpleInvoker).usend(url,method,data);
    }
    getOption(){
        return this.option;
    }
    getName(){
        return this.jgname;
    }    
    getAddress(){
        return this.getSocket().getAddress();
    }
    getState(){
        return this.lifeCycle.getState() as JigsawState;
    }
    getSocket(){
        return (this.provider as SimpleProvider).getSocket();
    }
    getRouter(){
        return (this.provider as SimpleProvider).getRouter();
    }
    getResolver(){
        return this.invoker.getResolver();
    }
    async close(){
        if(this.lifeCycle.getState() == "starting"){
            throw new Error("this instance is starting.");
        }
        if(this.lifeCycle.getState() == "closing" || this.lifeCycle.getState() == "closed")
            return;
        if(this.lifeCycle.getState() != "ready")
            throw new Error("at this state, the jigsaw can not be closed");

        
        this.lifeCycle.setState("closing");
        
        await this.invoker.close();
        await this.provider.close();

        await this.public_net?.router.close();
        await this.public_net?.client.close();
        await this.public_net?.socket.close();

        this.lifeCycle.setState("closed");

    }
}

export default SimpleJigsaw;