import JGError from "../JGError";

class InvokeTimeoutError extends JGError{
    public time_dura : number;
    public src_jigsaw : string;
    public dst_path : string;
    public data_size : number;
    public seq_id : number;
    constructor(time_dura:number,src_jigsaw:string,dst_path:string,data_size:number,seq_id:number){
        super(3012,"Invoke is Timeout");
        this.time_dura = time_dura;
        this.src_jigsaw = src_jigsaw;
        this.dst_path = dst_path;
        this.data_size = data_size;
        this.seq_id = seq_id;

        this.initMessage();
    }
    getName(){
        return "InvokeTimeoutError";
    }
    getDetail(){

        let size = Math.floor(this.data_size / 1024).toFixed(1);
        let prefix =` ${this.src_jigsaw} -> ${this.dst_path} (#${this.seq_id}) [${size}KB] `;
        return `${prefix}\n\nmax_time : ${this.time_dura}ms reached\nensure that remote host is ALIVE`;
    }
}

export = InvokeTimeoutError;

