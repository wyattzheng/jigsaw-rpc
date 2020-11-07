import Packet from "../protocol/Packet";
import RequestState from "./RequestState";

import { TypedEmitter } from "tiny-typed-emitter";

interface RequestEvent{
	done:(err : Error | undefined)=>void;
	built:(err : Error | undefined)=>void;
}

abstract class AbstractRequest extends TypedEmitter<RequestEvent>{
	protected state : RequestState = RequestState.BUILDING;
	protected failed_reason? :Error;

	public async whenBuild(): Promise<void>{
		if(this.state == RequestState.BUILT)
			return;

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
	public async whenDone() : Promise<void>{
		if(this.state == RequestState.DONE || this.state == RequestState.FAILED)
			return;
			
		if(this.state != RequestState.PENDING)
			throw new Error("this method must be called on PENDING state");
		return new Promise((resolve,reject)=>{
			this.once("done",(err)=>{
				if(err)
					reject(err)
				else
					resolve();

			})
		})
	}
	protected setFailedState(reason : Error):void{
		this.failed_reason = reason;
		this.setState(RequestState.FAILED);
	}
	protected setState(s : RequestState) : void{
		
		if(this.state == RequestState.BUILDING){
			if(s==RequestState.BUILT){
				this.state = s;
				this.emit("built",undefined);
				return;
			}else if(s==RequestState.FAILED){
				this.state = s;
				this.emit("built",this.failed_reason as Error);
				this.emit("done",this.failed_reason as Error);
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

		if(this.state == s){
			return;
		}

		throw new Error(`can not set to this state ${this.state} -> ${s}`);
    }
	getState() : RequestState{
        return this.state;
	}
	abstract getName() : string;
	abstract run() : void;
	abstract getRequestId() : string;
}


export default AbstractRequest