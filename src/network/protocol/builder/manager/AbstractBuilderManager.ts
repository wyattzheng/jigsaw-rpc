import IBuilderManager = require("./IBuilderManager");
import IBuilder = require("../IBuilder");
import LimitedMap = require("../../../../utils/LimitedMap")
import PacketBuilder = require("../PacketBuilder");
import IFactory = require("../../factory/IFactory");

abstract class AbstractBuilderManager<T,P> implements IBuilderManager<T,P>{
	public builders = new LimitedMap<string,IBuilder<T,P>>(1000);
	
	abstract getNewBuilder(maxslices : number) : IBuilder<T,P>;

	public createBuilder(key : string,partmax : number){
		if(this.builders.has(key))
				throw new Error("this builder has already exist");
		
		this.builders.set(key,this.getNewBuilder(partmax));
	}
	public hasBuilder(key : string): boolean{
		return this.builders.has(key);
	}

	protected getBuilder(key : string) : IBuilder<T,P>{
		
		if(!this.builders.has(key))
			throw new Error("this builder doesn't exist")
		
		return this.builders.get(key);
	}
	protected deleteBuilder(key : string) : void{
		this.builders.delete(key);
	}
	public addPart(key : string, slice : T) : void{
		let builder = this.getBuilder(key);
		builder.addPart(slice);
		
	}
	public isDone(key : string) : boolean{
		let builder = this.getBuilder(key);
		return builder.isDone();
	}
	public getBuilt(key : string) : P{
		let builder = this.getBuilder(key);
		return builder.getData();
	}

}

export = AbstractBuilderManager;
