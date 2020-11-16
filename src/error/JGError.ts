abstract class JGError extends Error{
    public readonly code : number;
    public desc : string;
    constructor(code : number,desc:string){
        super("");
        this.code = code;
        this.desc = desc;
    }
    initMessage(){
        this.message = `\n\n[JGError] {${this.code}} : ${this.desc}\n\n${this.getDetail()}\n`
    }
    getShortMessage(){
        return `\n\n[JGError] {${this.code}} : ${this.desc}\n`;
    }
    hasPayloadError(){
        return false;
    }
    getPayloadError(){
        return new Error();
    }
    abstract getName() : string;
    abstract getDetail() : string;
}

export default JGError;
