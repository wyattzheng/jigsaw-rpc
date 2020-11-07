import Packet from "../protocol/Packet";

interface IHandler{
    handlePacket(pk : Packet):void;
}

export default IHandler;
