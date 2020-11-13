import { TypedEmitter } from "tiny-typed-emitter";
import Packet from "../protocol/Packet";
interface HandlerEvent{
    error: (err:Error)=>void;
}

interface IHandler{
    getEventEmitter() : TypedEmitter<HandlerEvent>
    handlePacket(pk : Packet):void;
    close():Promise<void>;
}

export default IHandler;
