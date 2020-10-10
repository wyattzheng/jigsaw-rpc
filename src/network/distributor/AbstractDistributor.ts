import AbstractDistributee = require("./AbstractDistributee");

abstract class AbstractDistributor{
	private members : AbstractDistributee[] = new Array<AbstractDistributee>();
	constructor(){};
	public abstract addMember(member : AbstractDistributee);
	public abstract distMessage(message : object);
}

export = AbstractDistributor;
