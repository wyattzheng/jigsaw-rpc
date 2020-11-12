import AddressInfo from "../AddressInfo";

class DomainCache{
    public addrinfos : Array<{jgid:string,addr:AddressInfo}> = [];
    public createTime : number = new Date().getTime();
    public expired : number;
    constructor(expired : number = 10 * 1000){
        this.expired = expired;
    }
    add(jgid:string , addrinfo : AddressInfo){
        let exists = this.addrinfos.findIndex((v)=>{
            return 

            v.jgid == jgid
            && v.addr.address == addrinfo.address
            && v.addr.port == addrinfo.port;
        }) != -1;

        if(!exists)
            this.addrinfos.push({jgid,addr:addrinfo});
        
    }
    clearCache(jgid :string){

        this.addrinfos = this.addrinfos.filter((x)=>{
            return x.jgid != jgid;
        })
    }
    getRandomOne(){

        let index = Math.floor(this.addrinfos.length * Math.random());
        return this.addrinfos[index].addr;
    }
    isExpired() : boolean{
        let alive = this.createTime + this.expired - new Date().getTime();
        return alive < 0;
    }
}



export default DomainCache;
