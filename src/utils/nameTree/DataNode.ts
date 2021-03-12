import FormatError from "../../error/FormatError";
import NameTreeError from "../../error/NameTreeError";

enum NodeType{
    GROUP,
    ENDPOINT
}

class DataNode<T>{
    static NodeType = NodeType;
    private type : NodeType;
    private data? : T;
    private name : string = "";
    private child_map = new Map<string,DataNode<T>>();

    constructor(type : NodeType){
        this.type = type;
    }
    setName(name : string){
        this.name = name;
    }
    getName(){
        return this.name;
    }
    getChildren() : Array<DataNode<T>>{
        return Array.from(this.child_map.values());
    }
    getChild(key:string) : DataNode<T>{
        if(!this.child_map.has(key))
            throw new NameTreeError(`${key} child doesn't exists`);

        return this.child_map.get(key) as DataNode<T>;
    }
    hasChild(key:string) : boolean{
        return this.child_map.has(key);
    }
    addChild(key:string,node:DataNode<T>){
        if(this.child_map.has(key))
            throw new NameTreeError(`${key} child exists`);

        this.child_map.set(key,node);
    }
    removeChild(key:string){
        if(!this.hasChild(key))
            throw new NameTreeError(`${key} child doesn't exists`);

        this.child_map.delete(key);
    }

    getType() : NodeType{
        return this.type;
    }
    setData(data : T){
        this.data = data;
    }
    getData() : T{
        if(!this.data)
            throw new FormatError(`node data not a correct value`);

        return this.data;
    }

}

export default DataNode;