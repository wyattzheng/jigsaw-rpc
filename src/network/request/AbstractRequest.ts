import Packet = require("../protocol/Packet");
import RequestState = require("./RequestState");

import Events = require("tiny-typed-emitter");

interface RequestEvent{
	done:()=>{};
	failed:(err : Error)=>{};
	built:()=>{};
	buildfailed:(err : Error)=>{};
}
abstract class AbstractRequest extends Events.TypedEmitter<RequestEvent>{
	protected state : RequestState = RequestState.BUILDING;

	public whenBuild(): Promise<void>{
		if(this.state != RequestState.BUILDING)
			throw new Error("this method must be called on BUILDING state");

		return new Promise((resolve,reject)=>{
            
            this.once("built",()=>{
                resolve();
                return {};
            });

            this.once("buildfailed",(err)=>{
                reject(err);
                return {};
            });
            
        }
        
        );
	}
	protected setState(s : RequestState) : void{
		
		if(this.state == RequestState.BUILDING){
			if(s==RequestState.BUILT){
				this.state = s;
				this.emit("built");
				return;
			}else if(s==RequestState.FAILED){
				this.state = s;
				this.emit("buildfailed",new Error("building request failed"));
				return;
			}

		}else if(this.state ==RequestState.PENDING){
			if(s==RequestState.DONE){
				this.state = s;
				this.emit("done");
				return;
			}else if(s==RequestState.FAILED){
				this.state = s;
				this.emit("failed",new Error("request failed"));
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
	abstract getName() : string;
	abstract run() : void;
	abstract getRequestId() : string;
}


export = AbstractRequest