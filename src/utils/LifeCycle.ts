/*
Five States: starting ready closing close dead
*/

import assert from "assert";
import { TypedEmitter } from "tiny-typed-emitter";

type State = "starting" | "ready" | "closed" | "closing" | "dead";

interface LifeCycleEvent{
    state_changed:( to:State , from:State)=>void;
}


class NotNextStateError extends Error{
    constructor(){
        super("Not Next State")
    }
};
class AlreadyDeadError extends Error{};

class LifeCycle{
    private curr_state : State = "closed";
    private eventEmitter = new TypedEmitter<LifeCycleEvent>();
    private error? : Error;

    getEventEmitter(){
        return this.eventEmitter;
    }
    onClose(){

    }
    async when(lifecycle : State) : Promise<void>{
        if(this.curr_state == lifecycle)
            return;
        assert(this.isNextState(lifecycle),new NotNextStateError());

        return new Promise((resolve,reject)=>this.eventEmitter.once("state_changed",(to,from)=>{
            if(to == "closed"){
                reject(this.error)
            }else{
                resolve();
            }
        }));
    }
    isNextState(state : State){
        if(this.curr_state == "dead")
            return false;


        if(state == "closed")
            return true;


        if(this.curr_state == "closed" && state == "starting")
            return true;

        if(
            (this.curr_state == "starting" && state == "ready") ||
            (this.curr_state == "ready" && state == "closing")  ||
            (this.curr_state == "closed" && state == "dead") 
        )
            return true;

        return false;
    }
    setState(state : State){
        assert(this.isNextState(state),new NotNextStateError());
        let former = this.curr_state;
        this.curr_state = state;
        this.eventEmitter.emit("state_changed",state,former);
        this.error = undefined;
    }
    getState(){
        return this.curr_state;
    }
    setDead(err? : Error){
        assert(this.curr_state != "dead",new AlreadyDeadError());
        
        this.error = err;

        this.setState("closed");
        this.setState("dead");
    }
    on(event:State,callback:(former_state : State)=>void){
        this.eventEmitter.on("state_changed",(to,from)=>{
            if(to==event)
                callback(from);
        });
    }

}

export default LifeCycle;
