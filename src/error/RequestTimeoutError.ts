import JGError from "./JGError";

class RequestTimeoutError extends JGError{
    public time_dura : number;
    constructor(time_dura:number){
        super("JG3002","Request is Timeout");
        this.name = "RequestTimeoutError";
        this.time_dura = time_dura;
    }

}

export default RequestTimeoutError;

