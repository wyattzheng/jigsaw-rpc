import assert from "assert"

class DataValidator{
    private data : object;
    constructor(data : object){
        this.data = data;
    }
    validate(){
        this.checkSerializable(this.data);

    }
    checkSerializable(object : any) : void{

        for(let i in object){
            let obj = object[i];
            let type = typeof(obj);
            if(["undefined","function"].indexOf(type) != -1){
                throw new Error("data can not contain a unserializable property");
            }else if(type == "object")
                this.checkSerializable(obj);
        }
    }
    
}

export default DataValidator;