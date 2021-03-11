import IRegistryStorage from "./IRegistryStorage";
import AddressInfo from "../AddressInfo";
import { TypedEmitter } from "tiny-typed-emitter";
import NameTree from "../../utils/nameTree/NameTree";
import DataNode from "../../utils/nameTree/DataNode";


interface StorageEvent{
    DomainPurgeEvent:(jgid:string)=>void;
}

type RegNode = {jgid:string,jgname:string,address:AddressInfo,updateTime:number};
type QueryResult = Array<RegNode>;
type FlattedNodes = Array<{key:string,parent:string,name:string,type:number,nodedata:RegNode | undefined}>;


class RegistryStorage implements IRegistryStorage{
    private eventEmitter = new TypedEmitter<StorageEvent>();
    private nameTree = new NameTree<RegNode>();
    private expiredTime = 20*1000;

    constructor(){
        
    }
    clearExpiredNodes(){
        this.nameTree.map((node)=>{
            if(node.getType() != DataNode.NodeType.ENDPOINT)
                return;

            let data = node.getData();
            let curr_time = new Date().getTime();
            if(curr_time - data.updateTime > this.expiredTime){
                this.removeNode(data.jgid,data.jgname);
            }
            
        })
    }

    getEventEmitter(){
        return this.eventEmitter;   
    }

    setNode(jgid:string,jgname:string,addr:AddressInfo){

        let nodeid=`${jgname}.${jgid}`
        if(this.nameTree.hasEndNode(nodeid)){
            let node = this.nameTree.getEndNode(nodeid);
            let data = node.getData();
            data.jgid = jgid;
            data.address = addr;
            data.updateTime = new Date().getTime();
        }else{
            let node = new DataNode<RegNode>(DataNode.NodeType.ENDPOINT);
            let curr_time = new Date().getTime();
            node.setData({jgid,jgname,address:addr,updateTime:curr_time});
            this.nameTree.addNode(nodeid,node);
        }

    }
    removeNode(jgid:string,jgname:string){
        let nodeid = `${jgname}.${jgid}`;
      
        if(!this.nameTree.hasEndNode(nodeid))
            throw new Error("this node doesn't exist");

        let node = this.nameTree.getEndNode(nodeid);
        if(node.getData().jgid != jgid)
            throw new Error("this node's jgid isn't correct");

        this.nameTree.removeEndNode(nodeid);
        this.eventEmitter.emit("DomainPurgeEvent", jgid);
    }
    queryNode(jgname:string) : QueryResult{

        let node = this.nameTree.getNode(jgname);
        let dataset = [];


        if(node.getType() == DataNode.NodeType.GROUP){
            for(let n of node.getChildren()){
                if(n.getType() == DataNode.NodeType.ENDPOINT)
                    dataset.push(n.getData());

            }
        }else if(node.getType() == DataNode.NodeType.ENDPOINT){
            dataset.push(node.getData());

        }else
            throw new Error("this node type isn't correct");

        return dataset;
    }
    getFlattedNodes() : FlattedNodes{
        let nodes : FlattedNodes = [];
        this.nameTree.map((node,prefix,parent)=>{
            let parent_name = parent ? parent.getName() : "";
            let nodedata =node.getType() == 1? node.getData() : undefined;

            nodes.push({key:prefix,parent:parent_name,type:node.getType(),name:node.getName(),nodedata});
        })

        return nodes;
    }

}

export default RegistryStorage;
