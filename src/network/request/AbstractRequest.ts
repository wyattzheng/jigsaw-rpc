import Packet = require("../protocol/Packet");
import RequestState = require("./RequestState");

import Events = require("tiny-typed-emitter");

interface RequestEvent{
	done:(err : Error | undefined)=>void;
	built:(err : Error | undefined)=>void;
}
abstract class AbstractRequest extends Events.TypedEmitter<RequestEvent>{
	protected state : RequestState = RequestState.BUILDING;

	public whenBuild(): Promise<void>{
		if(this.state != RequestState.BUILDING)
			throw new Error("this method must be called on BUILDING state");

		return new Promise((resolve,reject)=>{
            this.once("built",(err)=>{
				if(err)
					reject(err);
				else
					resolve();
			});
        }
        
        );
	}
	protected setState(s : RequestState) : void{
		
		if(this.state == RequestState.BUILDING){
			if(s==RequestState.BUILT){
				this.state = s;
				this.emit("built",undefined);
				return;
			}else if(s==RequestState.FAILED){
				this.state = s;
				this.emit("done",new Error("building request failed"));
				return;
			}

		}else if(this.state ==RequestState.PENDING){
			if(s==RequestState.DONE){
				this.state = s;
				this.emit("done",undefined);
				return;
			}else if(s==RequestState.FAILED){
				this.state = s;
				this.emit("done",new Error("request failed"));
				return;
			}
		}else if(this.state == RequestState.BUILT){
			if(s==RequestState.PENDING){
				this.state = s;
				return;
			}else if(s==RequestState.FAILED){
				this.state = s;
				this.emit("done",new Error("building request failed"));
				return;
			}

		}

		throw new Error("can not set to this state");
    }
	getState() : RequestState{
        return this.state;
	}
	abstract getName() : string;
	abstract run() : void;
	abstract getRequestId() : string;
}


export = AbstractRequest