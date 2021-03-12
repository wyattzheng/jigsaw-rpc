import CommonError from "../error/CommonError";
import Defer from "./Defer";

export class AsyncManager{
    private no_async_defer? : Defer<void>;
    private async_ref_count : number = 0;
    private waiting : boolean = false;
    constructor(){

    }
    setRef(offset:number){
        if(this.waiting && offset > 0)
            throw new CommonError(`waiting for all asyncs done, but new refs added into AsyncManager`);

        this.async_ref_count += offset;
        if(this.waiting && this.async_ref_count == 0)
            this.no_async_defer?.resolve();
    }
    async waitAllDone(){
        this.waiting = true;
        this.no_async_defer = new Defer<void>();
        this.setRef(0);
        await this.no_async_defer.promise;
    }

}