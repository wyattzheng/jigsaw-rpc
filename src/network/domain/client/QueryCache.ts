import AddressInfo from "../AddressInfo";

type QueryResult = Array<{jgid:string,jgname:string,addr:AddressInfo}>;

class QueryCache{
    public addrinfos : QueryResult = [];
    public createTime : number = new Date().getTime();
    public expired : number;
    constructor(addrinfos :  QueryResult,expired : number = 10 * 1000){
        this.expired = expired;
        this.addrinfos = addrinfos;
    }
    clearCache_jgid(jgid :string){
        this.addrinfos = this.addrinfos.filter((x)=>{
            return x.jgid != jgid;
        })
    }
    getData(){
        return this.addrinfos;
    }
    isExpired() : boolean{
        let alive = this.createTime + this.expired - new Date().getTime();
        return alive < 0;
    }
}



export default QueryCache;
