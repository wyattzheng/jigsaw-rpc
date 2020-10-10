import assert = require("assert");

class LimitedMap<T,Z> {
	private maxsize : number;
	private keys : Array<T> = new Array<T>();
	private map : Map<T,Z>;

	constructor(size : number){
		assert(size  > 0 && size < 100*10000 , 
			"size must be provided correctly");

		this.map = new Map<T,Z>();
		this.maxsize = size;
	}
	set(key : T,value : Z) : void{
		if(this.has(key)){
			this.map.set(key,value);
			return;
		}

		if(this.keys.length >= this.maxsize){
			let keyshift : T = this.keys.shift() as T;

			this.map.delete(keyshift);
		}
		
		this.keys.push(key);
		this.map.set(key,value);
	}
	has(key : T){
		return this.map.has(key);
	}
	get(key : T) : Z{
		let v = this.map.get(key);
		if(v == undefined)
			throw new Error(`get value failed of '${key}'`)
		return v;
	}	
	length() : number{
		return this.keys.length;
	}
	getMap() : Map<T,Z>{
		return this.map;
	}

}

export = LimitedMap;