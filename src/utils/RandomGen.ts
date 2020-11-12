import crypto from "crypto";

class RandomGen{
    static GetRandomHash(len:number){
        return crypto.createHash("md5").update(Math.random()+"").digest("hex").substr(0,len);
    }
}


export default RandomGen;