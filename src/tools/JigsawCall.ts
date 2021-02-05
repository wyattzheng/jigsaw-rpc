
import { RPC } from "../index";
import URL from "url";


interface JigsawURLObject{
    registry:string,
    jgname:string
}
function parseJigsawURL(url:string) : JigsawURLObject{
    const url_obj = URL.parse(url);
    
    const registry = URL.format({
        protocol:url_obj.protocol,
        hostname:url_obj.hostname,
        port:url_obj.host
    });

    const jgname = (url_obj.pathname || "").replace("/","");
    if(!jgname.length || !url_obj.protocol)
        throw new Error(`can't parse JigsawURL : ${url}`);
    
    return { registry,jgname };
}

/**
 * @description 该方法可以自动创建 jigsaw实例 并进行一次性调用
 * @param url 服务详细地址, 格式如 jigsaw://localhost/testservice
 * @param method 调用的方法
 * @param data 远程调用参数, 必须是一个 Pure JS Object
 */
export async function JigsawCall(url:string,method:string,data:any = {}){
    const url_obj = parseJigsawURL(url);

    const jigsaw = RPC.GetJigsaw({registry:url_obj.registry});

    await new Promise<void>((resolve)=>jigsaw.once("ready",resolve));

    const result = await jigsaw.send(`${url_obj.jgname}:${method}`,data);

    await jigsaw.close();
    return result;
}