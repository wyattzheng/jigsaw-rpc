import {serializeError,deserializeError} from "serialize-error";

class JGError extends Error{
    public readonly code : string;
    public desc : string;
    public isJGError = true;
    
    constructor(code : string,desc:string){
        super("");
        this.code = code;
        this.desc = desc;
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
    static fromError(err : any){
        return new JGError("JG3000",err.message);
    }
}

export default JGError;
