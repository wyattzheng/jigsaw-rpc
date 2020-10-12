import IBuilderManager = require("./IBuilderManager");
import IBuilder = require("../IBuilder");

abstract class AbstractBuilderManager<T,P> implements IBuilderManager<T,P>{
	protected getBuilder(key : string) : IBuilder<T,P>{
		return this.builders.get(key);
	}
	protected deleteBuilder(key : string) : void{
		this.builders.delete(key);
	}
	addPart(key : string, slice : T){
		let builder = this.getBuilder(key);
		builder.addPart(slice);
		if(this.isDone(key))
			this.deleteBuilder(key);
	}
	isDone(key : string){
		let builder = this.getBuilder(key);
		builder.isDone(slice);
	}
	getData(key : string){
		let builder = this.getBuilder(key);
		builder.getData(slice);
	}

}

export = IBuilderManager;
