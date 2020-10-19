import assert=require("assert");
import Packet = require("../protocol/Packet");

class Path{
	public jgname : string = "";
	public method : string = "";
	constructor(jgname:string,method:string){
		assert(jgname.length<=64 && jgname.length>0, "jgname.length is incorrect");
		assert(method.length<=16 && method.length>0, "method.length is incorrect");

		this.jgname = jgname;
		this.method = method;
	}
	static fromString(path_str:string) : Path{

		let parts = path_str.split(":");
		assert(parts.length == 2,"path syntax error");
		let [jgname,method] = parts;
		let path = new Path(jgname,method);
		return path;
	}
	toString() : string{
		return `${this.jgname}:${this.method}`;
	}


}

export = Path;