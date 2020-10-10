import LimitedMap = require("../../../utils/LimitedMap");
import IBuilder = require("./IBuilder");
import assert = require("assert");

abstract class AbstractBuilder<T,P> implements IBuilder<T,P>{
	public partmax : number;

	private container : LimitedMap<number,T>;

	constructor(partmax : number){
		this.partmax = partmax;
		this.container = new LimitedMap<number,T>(1000);
	}
	public setPart(partid : number, part : T) : void{
		assert(partid < this.partmax && partid >= 0, "partid is incorrect");

		this.container.set(partid , part);
	}
	public isDone() : boolean{
		return this.container.length() == this.partmax;
	}
	public getData() : P{
		let map = this.container.getMap();
		let values : Array<T> = Array.from(map.values());
		let product : P = this.build(values);
		return product;
	}

	abstract build( parts : Array<T>) : P;
}

export = AbstractBuilder;