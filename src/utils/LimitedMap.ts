import assert = require("assert");

class Value<T>{
	public createTime : number = new Date().getTime();
	public val : T;
	constructor(val : T){
		this.val = val;
	}
	isExpired(){
		if(new Date().getTime() - this.createTime > 1*1000){
			return true;
		}

		return false;
	}

}
class LimitedMap<T,Z> {
	private maxsize : number;
	private keys : Array<T> = new Array<T>();
	private map : Map<T,Value<Z>>;
	private gc_counter : number = 0 ;

	constructor(size : number){
		assert(size  > 0 && size < 100*10000 , 
			"size must be provided correctly");

		this.map = new Map<T,Value<Z>>();
		this.maxsize = size;
	}
	set(key : T,value : Z) : void{
		this.checkGc();

		if(this.has(key)){
			let v = (this.map.get(key) as Value<Z>).val;
			if(v!=value)
				this.map.set(key,new Value(value));
			return;
		}

		if(this.keys.length >= this.maxsize){
			let keyshift : T = this.keys.shift() as T;

			this.map.delete(keyshift);
		}
		
		this.keys.push(key);
		this.map.set(key,new Value(value));
	}
	checkGc(){
		if(this.gc_counter++ > 10){
			this.gc_counter = 0;
			this.doGcCollect();
		}
	}
	doGcCollect(){
		for(let key of this.keys){
			if(!this.map.has(key))
				throw new Error("this map behave unexpected condition");

			let v = this.map.get(key) as Value<Z>;
			if(v.isExpired()){
				//console.log("gc",key);
				this.delete(key);
			}
		}
	}
	has(key : T){
		return this.map.has(key);
	}
	get(key : T) : Z{
		let v = this.map.get(key);
		if(v == undefined)
			throw new Error(`get value failed of '${key}'`)
		return v.val;
	}
	delete(key : T){
		let index=this.keys.indexOf(key);
		if(index == -1)
			throw new Error("this key doesn't exist");

		this.keys.splice(index,1);
		this.map.delete(key);
	}
	length() : number{
		return this.keys.length;
	}
	values() : Array<Z>{
		return Array.from(this.map.values()).map((x)=>(x.val));
	}
	getMap() : Map<T,Value<Z>>{
		return this.map;
	}

}

export = LimitedMap;