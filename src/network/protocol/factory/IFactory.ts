

interface IFactory<Z,T>{
	protected classes = new Map<number,{ new():T }>();

	protected register(cls : { new():T } ) : void;
	protected getProductCls(clsid : number) : { new():T };
	protected getProduct(data : z) : T;
	
}

export = IFactory;