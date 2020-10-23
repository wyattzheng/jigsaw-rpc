import LimitedMap = require("../../../utils/LimitedMap");
import IBuilder = require("./IBuilder");
import assert = require("assert");
import IFactory = require("../factory/IFactory");

abstract class AbstractBuilder<T,P> implements IBuilder<T,P>{
	public partmax : number;
	private container : LimitedMap<number,T>;
	private max_map_length : number = 1000;

	constructor(partmax : number){
		this.partmax = partmax;
		this.container = new LimitedMap<number,T>(this.max_map_length);
	}
	public clear(){
		this.container = new LimitedMap<number,T>(this.max_map_length);		
	}
	public addPart(part : T) : void{
		let partid = this.whichPart(part);
		assert(partid < this.partmax && partid >= 0, "partid is incorrect");

		this.container.set(partid , part);
	}
	public isDone() : boolean{
		return this.container.length() == this.partmax;
	}
	public getData() : P{
		let values : Array<T> = this.container.values();
		let product : P = this.build(values);


		//this.clear();
		return product;
	}

	abstract whichPart(part : T) : number;
	abstract build( parts : Array<T>) : P;
}

export = AbstractBuilder;