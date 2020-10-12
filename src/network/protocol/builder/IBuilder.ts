interface IBuilder<T,P>{
	protected partmax : number;

	public whichPart(part : T) : number;
	public addPart( part : T ) : void;
	public build( parts : Array<T>) : P;
	public isDone() : boolean;
	public getData() : P;
}

export = IBuilder;