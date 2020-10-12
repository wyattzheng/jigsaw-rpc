import assert = require("assert");
import events = require("tiny-typed-emitter");

interface StateEvent{
	changed: (event:string) => void;
};


export class StateManager extends events.TypedEmitter<StateEvent>{
	private define_states : Array<string>;
	private state : string;

	constructor(default_state : string, define_states : Array<string>){
		this.state = default_state;
		this.define_states = define_states;
	}
	hasState(state : string){
		return this.define_states.indexOf(state) != -1;
	}
	setState(state : string){
		assert(this.hasState(state),"this state is not defined");
		assert(this.state!=state,"target state and now state isn't different");

		this.state = state;
		this.emit("changed",state);
	}
	getState() : string{
		return this.state;
	}

}

export = StateManager;