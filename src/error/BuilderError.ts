class BuilderError extends Error{
    public tip : string;

    constructor(message:string){
        super(message);
        this.name = "BuilderError";

        this.tip = "";
    }
}

export default BuilderError;

