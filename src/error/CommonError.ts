class CommonError extends Error{
    public tip : string;

    constructor(message:string){
        super(message);
        this.name = "CommonError";

        this.tip = "";
    }
}

export default CommonError;

