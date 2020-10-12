interface IBuilder<T,P>{
	 partmax : number;

	 whichPart(part : T) : number;
	 addPart( part : T ) : void;
	 build( parts : Array<T>) : P;
	 isDone() : boolean;
	 getData() : P;
}

export = IBuilder;