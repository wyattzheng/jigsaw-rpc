import URL from "url";
import FormatError from "../error/FormatError";

export interface JigsawURLObject{
    protocol:string,
    hostname:string,
    port:number,
    jgname:string
};

export function parseJigsawURL(url:string) : JigsawURLObject{
    const url_obj = URL.parse(url);

    const jgname = (url_obj.pathname || "").replace("/","");
    if(!jgname.length || !url_obj.protocol)
        throw new FormatError(`can't parse JigsawURL : ${url}`);
    
    return { 
        protocol:url_obj.protocol,
        hostname:url_obj.hostname || "",
        port:url_obj.port ? parseInt(url_obj.port) : 3793,
        jgname : jgname
    };
}
;