class HandlerRef<T>{
    public refid: number;
    public data : T;
    constructor(refid:number,data:T){
        this.refid = refid;
        this.data = data;
    }
    
}

class HandlerMap<Z>{
    private refid:number = 0;
    private refs:number =0;
    private map : Map<string,Array<HandlerRef<Z>>> = new Map(); 
    constructor(){
        
    }
    
    getMapData(sign:string,refid:number) : Z{
        let handlers = this.getHandlers(sign);
        let data = handlers.find((x)=>(x.refid==refid));
        if(!data)
            throw new Error("not a valid refid")
        let ret = (data as HandlerRef<Z>).data;
        return ret;
    }
    hasHandlers(sign : string){
        return this.map.has(sign);
    }
    getHandlers(sign : string){
        if(!this.map.has(sign))
            throw new Error("this sign hasn't been unplugged");
        let handlers = this.map.get(sign) as Array<HandlerRef<Z>>;
        return handlers;
    }
    plug(sign:string, data:Z){
        let refid = this.refid++;

        if(!this.map.has(sign))
            this.map.set(sign,[]);

        let handlers = this.map.get(sign) as Array<HandlerRef<Z>>;
        let handler_ref = new HandlerRef(refid,data);

        handlers.push(handler_ref);


        return refid;
 
    }
    unplug(sign:string,refid:number){

        let handlers = this.getHandlers(sign);
        let index = -1;
        handlers.map((x,k)=>{
            if(x.refid==refid)
                index = k;
        });
        if(index < 0)
            throw new Error("unplug failed");

        handlers.splice(index,1);
        this.map.set(sign,handlers);

        if(handlers.length<=0)
            this.map.delete(sign);

    }
}

export = HandlerMap;
