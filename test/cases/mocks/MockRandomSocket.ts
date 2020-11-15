import { TypedEmitter } from "tiny-typed-emitter";
import ISocket from "../../../src/network/socket/ISocket";
import AddressInfo  from "../../../src/network/domain/AddressInfo";
import LifeCycle from "../../../src/utils/LifeCycle";
import InvokePacket from "../../../src/network/protocol/packet/InvokePacket";

interface SocketEvent{
    message:(buf:Buffer)=>void;
}

class MockRandomSocket implements ISocket{
    private eventEmitter = new TypedEmitter<SocketEvent>();
    private lifeCycle = new LifeCycle();
    private timeout? : NodeJS.Timeout;
    private emitting : boolean = false;
    constructor(){
        this.lifeCycle.setState("starting");
    }
    getEventEmitter(): TypedEmitter<SocketEvent> {
        return this.eventEmitter;
    }
    getLifeCycle(): LifeCycle {
        return this.lifeCycle;
    }
    async start(): Promise<void> {
        this.timeout = setInterval(()=>{
            if(this.emitting)
                this.generateMockedData();
        },100);
        setTimeout(()=>{
            this.lifeCycle.setState("ready");
        },0);
    }
    async setEmitting(emitting : boolean){
        this.emitting = emitting;
    }
    async close(): Promise<void> {
        this.lifeCycle.setState("closing");
        clearInterval(this.timeout as NodeJS.Timeout);
        this.lifeCycle.setState("closed");
    }
    private generateMockedData(){
        
        let pk = new InvokePacket();
        pk.isJSON = true;
        pk.src_jgname = "mocked";
        pk.request_id = "mocked";
        pk.encode();
        let buf = pk.getSlicedData();

        for(let i=0;i<Math.floor(buf.length*0.5);i++){
            if(Math.random()<0.5)
                buf[i] = Math.floor(Math.random() * 255);
        }
        this.eventEmitter.emit("message",buf);
    }
    send(data: Buffer, port: number, address: string): void {
        //throw new Error("Method not implemented.");

    }
    getAddress(): AddressInfo {
        return new AddressInfo("mocked",-1);
    }
    /*
        this socket recv random buffer to simulate a unexpected network condition
    */
   

}

export default MockRandomSocket;
