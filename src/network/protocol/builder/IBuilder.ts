interface IBuilder<T,P>{
	protected partmax : number;

	public setPart( partid : number, part : T ) : void;
	public build( parts : Array<T>) : P;
	public isDone() : boolean;
	public getData() : P;
}

export = IBuilder;