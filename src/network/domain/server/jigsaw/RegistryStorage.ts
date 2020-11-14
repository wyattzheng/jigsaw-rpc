import IRegistryStorage from "../IRegistryStorage";
import AddressInfo from "../../AddressInfo";
import { TypedEmitter } from "tiny-typed-emitter";
import NameTree from "./nameTree/NameTree";
import DataNode from "./nameTree/DataNode";


interface StorageEvent{
    DomainPurgeEvent:(jgid:string)=>void;
}



type RegNode = {jgid:string,jgname:string,address:AddressInfo,updateTime:number};
type QueryResult = Array<{jgid:string,addr:AddressInfo}>;

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

        if(this.nameTree.hasEndNode(jgname)){
            let node = this.nameTree.getEndNode(jgname);
            let data = node.getData();
            data.updateTime = new Date().getTime();
        }else{
            let node = new DataNode<RegNode>(DataNode.NodeType.ENDPOINT);
            let curr_time = new Date().getTime();
            node.setData({jgid,jgname,address:addr,updateTime:curr_time});
            this.nameTree.addNode(jgname,node);
        }

    }
    removeNode(jgid:string,jgname:string){
      
        if(!this.nameTree.hasEndNode(jgname))
            throw new Error("this node doesn't exist");

        let node = this.nameTree.getEndNode(jgname);
        if(node.getData().jgid != jgid)
            throw new Error("this node's jgid isn't correct");

        this.nameTree.removeEndNode(jgname);
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

        return dataset.map((x)=>{
            return {jgid:x.jgid,addr:x.address};
        });
    }

}

export default RegistryStorage;
