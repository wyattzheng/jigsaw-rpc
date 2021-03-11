import DataNode from "./DataNode";
import NodePath from "./NodePath";

class NameTree<T>{
    private root = new DataNode<T>(DataNode.NodeType.GROUP);
    constructor(){
        this.root.setName(".ROOT.");
    }
    getRoot(){
        return this.root;
    }
    addNode(path:string,node:DataNode<T>){
        if(node.getType() != DataNode.NodeType.ENDPOINT)
            throw new Error("this node type must be endpoint");

        let nodepath = NodePath.parse(path);
        let names = nodepath.getNodeNames();

/*        if(node.getName() != nodepath.getLastName())
            throw new Error("this node name isn't correct")*/
        node.setName(nodepath.getLastName());

        let curr_node = this.root;
        let level = 0;
        for(let nodename of names){
            
            let isLastLevel = names.length == level + 1;

            if(!curr_node.hasChild(nodename)){

                if(!isLastLevel){
                    let type = DataNode.NodeType.GROUP;
                    let groupnode = new DataNode<T>(type);
                    groupnode.setName(nodename);

                    curr_node.addChild(nodename,groupnode);
                }else{
                    curr_node.addChild(nodename,node);
                    return;
                }

            }else{
                let nd = curr_node.getChild(nodename);
                if(nd.getType() == DataNode.NodeType.ENDPOINT)
                    throw new Error("this node can't be added because of the tree toplogy.");
            }

            curr_node = curr_node.getChild(nodename);
            level++;
        }

    }
    removeEndNode(path:string){
        if(!this.hasEndNode(path))
            throw new Error("this end node doesn't exists");

        this.removeNode(path);
    }
    removeNode(path:string){
        if(!this.hasNode(path))
            throw new Error("this node doesn't exists");
        
        let nodepath = NodePath.parse(path);
        let shouldRemove = true;

        for(let i=0;i<100;i++){
            let node = this.getParentNode(nodepath.getPath());

            if(shouldRemove)
                node.removeChild(nodepath.getLastName());
            
            let len = node.getChildren().length;
            if(len <= 0){
                shouldRemove = true;
            }else{
                shouldRemove = false;
            }
            
            nodepath.popLast();
            if(nodepath.getNodeNames().length <= 0)
                return;
        }

        throw new Error("remove node failed");
        
    }
    hasNode(path:string){
        try{
            let name = NodePath.parse(path).getLastName();
            return this.getParentNode(path).hasChild(name);    
        }catch(err){
            return false;
        }
    }
    hasEndNode(path:string){
        try{
            if(this.hasNode(path)){
                let node = this.getNode(path);
                if(node.getType() == DataNode.NodeType.ENDPOINT)
                    return true;
            }    
        }catch(err){
            return false;
        }
        return false;
    }
    getNode(path:string){
        let name = NodePath.parse(path).getLastName();
        let pnode = this.getParentNode(path);
        if(!pnode.hasChild(name))
            throw new Error("can't get this node");

        let node = pnode.getChild(name);

        return node;
    }
    getEndNode(path:string){
        let node = this.getNode(path);
        if(node.getType() != DataNode.NodeType.ENDPOINT)
            throw new Error("this node is not a endpoint node");
        return node;
    }
    getChildren(path:string){
        let node = this.getNode(path);
        if(node.getType() != DataNode.NodeType.GROUP)
            throw new Error("this node is not a group node");
        
        return node.getChildren();
    }
    getParentNode(path:string) : DataNode<T>{
        let names = NodePath.parse(path).getNodeNames();

        let curr_node = this.root;
        let level = 0;
            
        for(let nodename of names){
            let isLastLevel = names.length == level + 1;

            if(!curr_node.hasChild(nodename))
                throw new Error("can't get parent node, this path isn't correct");

            if(isLastLevel){
                return curr_node;
            }else
                curr_node = curr_node.getChild(nodename);
            level++;
        }

        throw new Error("can't get parent node");
    }
    map(handler : (n : DataNode<T>,prefix:string,p? : DataNode<T>)=>void){

        let search=(node:DataNode<T>,prefix:string,parent?:DataNode<T>)=>{
            let isRoot = node.getName() == ".ROOT.";
            if(!isRoot)
                handler(node,prefix + node.getName(),parent);
            
            let children = node.getChildren();
            for(let child of children){
                let next_prefix = prefix + node.getName()+".";

                search(child,isRoot?"":next_prefix,node);
            }
        }
        
        search(this.root,"",undefined);
    }

}

export default NameTree;
