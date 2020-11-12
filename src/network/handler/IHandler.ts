import Packet from "../protocol/Packet";

interface IHandler{
    handlePacket(pk : Packet):void;
    close():Promise<void>;
}

export default IHandler;
