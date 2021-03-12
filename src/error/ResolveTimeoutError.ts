class ResolveTimeoutError extends Error{
    public path : string;
    public req_seq : number;
    public tip : string;

    constructor(dst_path:string,req_seq:number){
        super("Path resolving reach its max retry time.");
        this.name = "ResolveTimeoutError";
        this.path = dst_path;
        this.req_seq = req_seq;

        this.tip = "Does this domain has setting up a Registry Server already?";
    }
}

export default ResolveTimeoutError;

