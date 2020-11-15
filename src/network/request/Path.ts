import assert from "assert";

class Path{
	public regpath : string = "";
	public method : string = "";
	constructor(regpath:string,method:string){
		assert(regpath.length<=64 && regpath.length>0, "regpath.length is incorrect");
		assert(method.length<=16 && method.length>0, "method.length is incorrect");

		this.regpath = regpath;
		this.method = method;
	}
	static fromString(path_str:string) : Path{

		let parts = path_str.split(":");
		assert(parts.length == 2,"path syntax error");
		let [regpath,method] = parts;
		let path = new Path(regpath,method);
		return path;
	}
	stringify() : string{
		return `${this.regpath}:${this.method}`;
	}


}

export default Path;