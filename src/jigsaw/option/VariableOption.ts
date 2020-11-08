import assert from "assert";

class VariableOption{
    private map  = new Map<string,string | undefined>();
    
    set(key:string,value:string){
        this.map.set(key,value);
    }
    has(key:string){
        if(this.map.has(key)){
            if(this.map.get(key))
                return true;
        }
        return false;
    }
    get(key:string) : string{
        if(!this.has(key))
            throw new Error("don't have this option key");
            
        return this.map.get(key) as string;
    }
    static from(obj : object){
        let option = new VariableOption();

        let keys = Object.keys(obj);
        let values = Object.values(obj);
        for(let v of values)
            assert(typeof(v) == "string","option value must be string");
        
        for(let index in keys){
            option.set(keys[index],values[index]);
        }
        return option;
    }
}

export default VariableOption;