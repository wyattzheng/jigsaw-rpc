

interface IFactory<Z,T>{
	
	register(cls : { new():T } ) : void;
	getProductCls(clsid : number) : { new():T };
	getProduct(data : Z) : T;
	
}

export = IFactory;