class NodePath{
    private nodenames = new Array<string>();
    constructor(names : Array<string> = []){
        this.nodenames = names;
    }
    
    getPath(){
        return this.nodenames.join(".");
    }
    getNodeNames(){
        return this.nodenames;
    }
    addNodeName(name : string){
        this.nodenames.push(name);
    }
    popLast(){
        this.nodenames.pop();
    }
    getLastName(){
        return this.nodenames[this.nodenames.length - 1];
    }

    static parse(path : string){
        let nodepath=new NodePath();
        
        let splited = path.split(".");
            
        for(let s of splited)
            nodepath.addNodeName(s);
        return nodepath;
    }
}

export default NodePath;