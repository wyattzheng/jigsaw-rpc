class NameTreeError extends Error{
    public tip : string;

    constructor(message:string){
        super(message);
        this.name = "NameTreeError";

        this.tip = "";
    }
}

export default NameTreeError;

