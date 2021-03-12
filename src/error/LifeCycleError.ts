class LifeCycleError extends Error{
    public tip : string;
    public current_state : string;
    constructor(message:string,current_state:string){
        super(message);
        this.name = "LifeCycleError";
        this.current_state = current_state;

        this.tip = "";
    }
}

export default LifeCycleError;

