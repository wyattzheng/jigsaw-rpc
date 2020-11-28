import IRoute from "../../network/router/route/IRoute";
import AddressInfo from "../../network/domain/AddressInfo";
import IJigsaw from "../IJigsaw";
namespace BaseContext{
    export interface PreBaseContext {
        readonly rawdata : any;
        readonly rawpathstr : string;
        readonly rawroute : IRoute;
    
        data:any;
        pathstr:string;
        route:IRoute;
    }
    export interface UseBaseContext {
        readonly data:any;
        readonly rawdata:Buffer;
        readonly method:string;
        readonly isJSON:boolean;
        readonly reply_info:AddressInfo;
        readonly sender:string;
        readonly jigsaw:IJigsaw;
    
        result:any
    }
    export interface PostBaseContext {
        readonly pathstr:string;
        readonly data:any;
    
        result:any;
    }
}

export default BaseContext;


