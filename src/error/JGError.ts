class JGError extends Error{
    public readonly code : number;
    public desc : string;
    public parsing_str? : string;
    public isJGError = true;
    
    constructor(code : number,desc:string,parsing_str?:string){
        super("");
        this.code = code;
        this.desc = desc;
        this.parsing_str = parsing_str;
        this.initMessage();
    }
    initMessage(){
        this.message = `\n\n[JGError] {${this.code}} : ${this.desc}\n\n${this.getDetail()}\n`
    }
    getShortMessage(){
        return `\n\n[JGError] {${this.code}} : ${this.desc}\n`;
    }
    stringify(){
        let obj={
            code:this.code,
            desc:this.desc,
            name:this.name,
            message:this.message,
            parsing_str:this.parsing_str
        };

        return JSON.stringify(obj);
    }
    static parse(str:string){
        let parsed = JSON.parse(str);
        let ret = new JGError(parsed.code,parsed.desc,parsed.parsing_str);
        ret.name = parsed.name;
        ret.message = parsed.message;

        return ret;
    }
    static fromError(err : Error){
        return new JGError(-1,err.message);
    }

    getDetail() : string{
        return "";
    }
}

export default JGError;
