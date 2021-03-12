import IBuilderManager from "./IBuilderManager";
import IBuilder from "./IBuilder";
import LimitedMap from "../../../utils/LimitedMap"
import PacketBuildingError from "../../../error/BuilderError";


abstract class AbstractBuilderManager<T,P> implements IBuilderManager<T,P>{
	public builders = new LimitedMap<string,IBuilder<T,P>>(500);
	
	abstract getNewBuilder(maxslices : number) : IBuilder<T,P>;

	public createBuilder(key : string,partmax : number){
		if(this.builders.has(key))
				throw new PacketBuildingError("this builder has already exist");
		
		this.builders.set(key,this.getNewBuilder(partmax));
	}
	public hasBuilder(key : string): boolean{
		return this.builders.has(key);
	}

	protected getBuilder(key : string) : IBuilder<T,P>{
		
		if(!this.builders.has(key))
			throw new PacketBuildingError("this builder doesn't exist")
		
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
		let data = builder.getData();
		//this.deleteBuilder(key);

		//TODO: manage this built data, to keep lower memory usage
		return data;
	}

}

export default AbstractBuilderManager;
