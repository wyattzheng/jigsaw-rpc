class Defer<T>{
    public promise : Promise<T>;
    private resolver:(value:T)=>void = ()=>{};
    private rejecter:(err:Error)=>void = ()=>{};
    constructor(){
        this.promise = new Promise<T>((resolve,reject)=>{
            this.resolver=resolve;
            this.rejecter=reject;
        })
    }
    resolve(value : T){
        this.resolver(value);
    }
    reject(err:Error){
        this.rejecter(err);
    }

}

export default Defer;