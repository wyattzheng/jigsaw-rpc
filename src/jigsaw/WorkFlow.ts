type NextFunction = ()=>Promise<void>;
type WorkFunction = (ctx:any,next:NextFunction)=>Promise<void>;

class WorkFlow{

    private works = new Array<WorkFunction>();
    private context : any;
    private current_work = 0;

    pushWork(work : WorkFunction){
        this.works.push(work);
    }
    async call(context : any) : Promise<any>{
        this.context = context;
        this.current_work = 0;
        
        await this.callNextWork();
        
        return this.context;
    }
    private async callNextWork(){
        let work = this.works[this.current_work++];
        if(!work)
            return;

        let next : NextFunction = ()=>this.callNextWork();

        return work(this.context,next);
    }

}



export default WorkFlow;
