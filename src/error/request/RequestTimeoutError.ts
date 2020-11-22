import JGError from "../JGError";

class RequestTimeoutError extends JGError{
    public time_dura : number;
    constructor(time_dura:number){
        super(3002,"Request is Timeout");
        this.name = "RequestTimeoutError";
        this.time_dura = time_dura;
        this.initMessage();
    }
    getDetail(){
        return `max_time : ${this.time_dura}ms reached\nensure that remote host is ALIVE`;
    }

}

export default RequestTimeoutError;

