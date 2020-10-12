import LimitedMap = require("../../../../utils/LimitedMap");
import IBuilder = require("../IBuilder");

interface IBuilderManager<T,P>{
	protected builders : LimitedMap<string,IBuilder<T,P>>;

	addPart(key : string, slice : T);
	isDone(key : string);
	getData(key : string);

}

export = IBuilderManager;
