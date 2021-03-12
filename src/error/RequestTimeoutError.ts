class RequestTimeoutError extends Error{
    public time_dura : number;
    public tip : string;

    constructor(time_dura:number){
        super("Request is Timeout");
        this.name = "RequestTimeoutError";
        this.time_dura = time_dura;

        this.tip = "Is remote jigsaw alive?";
    }
}

export default RequestTimeoutError;

