
interface IBuilderManager<T,P>{

	hasBuilder(key : string):boolean;
	createBuilder(key : string,partmax : number):void;
	addPart(key : string, slice : T) : void;
	isDone(key : string) : boolean;
	getBuilt(key : string) : P;

}

export = IBuilderManager;
