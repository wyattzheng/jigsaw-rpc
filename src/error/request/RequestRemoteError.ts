import Path from "../../network/request/Path";
import JGError from "../JGError";

class RequestRemoteError extends JGError{
    public error : Error;
    constructor(error : Error){
        super(3001,"Request Remote Error Occurred");
        this.name = "RequestRemoteError";
        this.error = error;
        this.initMessage();
    }

    getError(){
        return this.error;
    }
    getDetail(){
        return this.error.toString();
    }
    
}

export default RequestRemoteError;
