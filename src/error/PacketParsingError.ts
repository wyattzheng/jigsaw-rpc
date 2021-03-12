class PacketParsingError extends Error{
    public tip : string;

    constructor(message:string){
        super(message);
        this.name = "PacketParsingError";

        this.tip = "";
    }
}

export default PacketParsingError;

