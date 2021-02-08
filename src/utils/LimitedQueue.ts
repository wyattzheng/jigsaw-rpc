export class LimitedQueue<T>{
    private queue : T[] = [];
    private limit : number;
    constructor(limit : number = 2000){
        this.limit = limit;

    }
    getLength(){
        return this.queue.length;
    }
    push(v : T){
        if(this.queue.length >= this.limit)
            this.queue.shift();
        
        this.queue.push(v);
    }
    shift() : T | undefined{
        return this.queue.shift();
    }
    get(key:number) : T | undefined{
        return this.queue[key];
    }
}