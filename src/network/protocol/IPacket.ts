import AddressInfo from "../../domain/AddressInfo";

interface IPacket{
    release():void;

    getPacketId():number;
    getName():string;

    
    getSlicedData():Buffer;
    setBuffer(buf:Buffer):void;
    
    encode():void;
    decode():void;
    isBuilt():boolean;

    setRequestId(reqid:string):void;
    getRequestId():string;

    setReplyInfo(addrinfo:AddressInfo) : void;
    getReplyInfo() : AddressInfo;
}

export default IPacket;
