class FormatError extends Error{
    public tip : string;

    constructor(message:string){
        super(message);
        this.name = "FormatError";

        this.tip = "";
    }
}

export default FormatError;

