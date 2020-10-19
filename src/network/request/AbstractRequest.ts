import Packet = require("../protocol/Packet");
import RequestState = require("./RequestState");

import Events = require("tiny-typed-emitter");

interface RequestEvent{
	done:()=>{},
	failed:(err : Error)=>{}
}
abstract class AbstractRequest extends Events.TypedEmitter<RequestEvent>{
	protected state : RequestState = RequestState.BUILDING;

	protected setState(s : RequestState) : void{
		
		if(this.state == RequestState.BUILDING){
			if(s==RequestState.BUILT){
				this.state = s;
				return;
			}

		}else if(this.state ==RequestState.PENDING){
			if(s==RequestState.DONE){
				this.state = s;
				return;
			}else if(s==RequestState.FAILED){
				this.state = s;
				return;
			}
		}else if(this.state == RequestState.BUILT){
			if(s==RequestState.PENDING){
				this.state = s;
				return;
			}

		}

		throw new Error("can not set to this state");
    }
	getState() : RequestState{
        return this.state;
	}
	abstract run() : void;
	abstract getRequestId() : string;
}


export = AbstractRequest