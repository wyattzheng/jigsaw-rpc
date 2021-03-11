import JGError from "./JGError";

class InvokeTimeoutError extends JGError{
    public time_dura : number;
    public src_jigsaw : string;
    public dst_path : string;
    public data_size : number;
    public seq_id : number;
    constructor(time_dura:number,src_jigsaw:string,dst_path:string,data_size:number,seq_id:number){
        super("JG3012","Invoke is Timeout");
        this.name = "InvokeTimeoutError";
        this.time_dura = time_dura;
        this.src_jigsaw = src_jigsaw;
        this.dst_path = dst_path;
        this.data_size = data_size;
        this.seq_id = seq_id;

    }
}

export default InvokeTimeoutError;

