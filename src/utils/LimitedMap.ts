import assert from "assert";
import { TypedEmitter } from "tiny-typed-emitter";

class Value<T>{
	public createTime : number = new Date().getTime();
	public val : T;
	constructor(val : T){
		this.val = val;
	}
	isExpired(){
		if(new Date().getTime() - this.createTime > 20*1000){
			return true;
		}

		return false;
	}

}

interface LimitedMapEvent<T>{
	deleted:(item:T)=>void;
}
class LimitedMap<T,Z> extends TypedEmitter<LimitedMapEvent<Z>>{
	private maxsize : number;
	private keys : Array<T> = new Array<T>();
	private map : Map<T,Value<Z>>;
	private gc_counter : number = 0 ;

	constructor(size : number){
		super();

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

		if(this.keys.length >= this.maxsize)
			this.delete(this.keys[0]);
		
		
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
		let deleted = (this.map.get(key) as Value<Z>).val;
		this.map.delete(key);

		this.emit("deleted",deleted);
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

export default LimitedMap;