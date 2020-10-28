abstract class JGError extends Error{
    public readonly code : number;
    public desc : string;
    constructor(code : number,desc:string){
        super("");
        this.code = code;
        this.desc = desc;
    }
    initMessage(){
        this.message = `[JGError] {${this.code}} : ${this.desc}\n\n${this.getDetail()}\n`
    }
    getShortMessage(){
        return `[JGError] {${this.code}} : ${this.desc}\n`;
    }
    abstract getName() : string;
    abstract getDetail() : string;
}

export = JGError;
