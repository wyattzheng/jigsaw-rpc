import {serializeError,deserializeError} from "serialize-error";

class JGError extends Error{
    public readonly code : string;
    public isJGError = true;
    
    constructor(code : string,message:string){
        super(message);
        this.code = code;
    }
    stringify(){
        return JSON.stringify(serializeError(this));
    }
    static parse(str:string) : JGError{
        let parsed_error_obj = JSON.parse(str);
        let ret:any = new JGError(parsed_error_obj.code,parsed_error_obj.desc);
        for(let key in parsed_error_obj){
            ret[key] = parsed_error_obj[key];
        }
        return ret;
    }
    static fromError(err : Error){
        return JGError.parse(JSON.stringify(serializeError(err)));
    }
}

export default JGError;
