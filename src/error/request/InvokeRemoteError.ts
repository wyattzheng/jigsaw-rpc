import Path from "../../network/request/Path";
import JGError from "../JGError";

class InvokeRemoteError extends JGError{
    public error : Error;
    public src_jigsaw : string;
    public dst_path : string;
    public data_size : number;
    public seq_id : number;

    constructor(error : Error,src_jigsaw:string,dst_path:string,data_size:number,seq_id:number){
        super(3011,"Invoke Remote Error Occurred");
        this.error = error;
        this.src_jigsaw = src_jigsaw;
        this.dst_path = dst_path;
        this.data_size = data_size;
        this.seq_id = seq_id;
        this.initMessage();
    }
    getName(){
        return "InvokeRemoteError";
    }
    getError(){
        return this.error;
    }
    
    getDetail(){
        let stack = this.error.stack || "";
        let size = Math.floor(this.data_size / 1024).toFixed(1);
        let prefix =` ${this.src_jigsaw} -> ${this.dst_path} (#${this.seq_id}) [${size}KB] `;

        return `${prefix}\n\n${stack}`;
    }
    

}

export default InvokeRemoteError;
