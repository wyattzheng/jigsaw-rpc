
import { GetJigsaw } from "../api/GetJigsaw";
import IJigsaw from "../jigsaw/IJigsaw";
import Path from "../network/request/Path";
import RegistryRoute from "../network/router/route/RegistryRoute";
import RegistryResolver from "../network/domain/client/RegistryResolver";
import RegistryServerInfo from "../network/domain/RegistryServerInfo";
import DomainCacheStorage from "../network/domain/client/QueryCacheStorage";

import URL from "url";

const domain_cache = new DomainCacheStorage();
const jigsaw = GetJigsaw({disable_updater:true});
jigsaw.on("error",()=>{ });


interface JigsawURLObject{
    protocol:string,
    hostname:string,
    port:number,
    jgname:string
}
function parseJigsawURL(url:string) : JigsawURLObject{
    const url_obj = URL.parse(url);

    const jgname = (url_obj.pathname || "").replace("/","");
    if(!jgname.length || !url_obj.protocol)
        throw new Error(`can't parse JigsawURL : ${url}`);
    
    return { 
        protocol:url_obj.protocol,
        hostname:url_obj.hostname || "",
        port:url_obj.port ? parseInt(url_obj.port) : 3793,
        jgname : jgname
    };
}

/**
 * @description 该方法可以自动创建 jigsaw实例 并进行一次性调用
 * @param url 服务详细地址, 格式如 jigsaw://localhost/testservice
 * @param method 调用的方法
 * @param data 远程调用参数, 必须是一个 Pure JS Object
 */
export async function JigsawCall(url:string,method:string,data:any = {}){

    if(jigsaw.getState() != "ready")
        throw new Error(`jigsaw isn't ready, please wait for a second`);

    const url_obj = parseJigsawURL(url);

    const reg_server_info = new RegistryServerInfo(url_obj.protocol,url_obj.hostname,url_obj.port);
    const resolver = new RegistryResolver(reg_server_info,jigsaw.getRouter(),domain_cache);
    const result = await jigsaw.call(
            new Path(url_obj.jgname,method),
            new RegistryRoute(url_obj.jgname,resolver),
            data);

    await resolver.close();

    return result;
}

export { jigsaw as default_jigsaw };
