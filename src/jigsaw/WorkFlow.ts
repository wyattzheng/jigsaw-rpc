type NextFunction = ()=>Promise<void>;
type WorkFunction = (ctx:any,next:NextFunction)=>Promise<void>;


type Calling = {current_work:number,context:any};

class WorkFlow{

    private works = new Array<WorkFunction>();
    private callings : Map<number,Calling> = new Map();
    private current_work = 0;
    private callid_count = 0;

    pushWork(work : WorkFunction){
        this.works.push(work);
    }
    async call(context : any) : Promise<any>{
        let callid = this.callid_count++;

        try{
            this.callings.set(callid,{current_work:0,context});
            await this.callNextWork(callid);
        }catch(err){
            throw err;
        }finally{
            this.callings.delete(callid);
        }
        return context;
    }
    private async callNextWork(callid:number){
        let obj = this.callings.get(callid) as Calling;
        let work = this.works[obj.current_work++];
        if(!work)
            return;

        let next : NextFunction = ()=>this.callNextWork(callid);

        return work(obj.context,next);
    }

}



export default WorkFlow;
