import AddressInfo from "../domain/AddressInfo";

import { TypedEmitter } from "tiny-typed-emitter";
import { JigsawOption } from "./JigsawOption";
import { UseContext } from "./context/Context";
import { PostWare, PreWare, UseWare } from "./JigsawWare"

export type JigsawState = "starting" | "ready" | "closed" | "closing";

export interface JigsawEvent{
    error:(err : Error)=>void;
    ready:()=>void;
    closed:()=>void;
}

export interface IJigsaw extends TypedEmitter<JigsawEvent>{
    /**
     * Get the jigsaw name.
     */
    getName() : string;

    /**
     * Get the option passed to jigsaw constructor.
     */
    getOption() : JigsawOption;

    /**
     * Get the state string,
     * it can be one of 'starting'/'ready'/'closing'/'closed'
     */
    getState() : JigsawState;
    
    /**
     * Invoke a remote jigsaw port
     * 
     * * This API will use registry-client insided
     * to resolve the network address of the target jigsaw.
     * 
     * @param path_str path_str is like 'JGNAME:PORTNAME'
     * @param data data should be a pure-json-object
     */
    send(path_str:string,data?:any) : Promise<any>;

    /**
     * Invoke a remote jigsaw port
     * 
     * * This API parses JIGSAW URL and do once invoking
     * 
     * @param url JIGSAW URL is like 'jigsaw://127.0.0.1/jigsawname'
     * @param data data should be a pure-json-object
     */
    usend(url:string,method:string,data?:any):Promise<any>;

    /**
     * Invoke a remote jigsaw port
     * 
     * * This API allows you to call jigsaw
     * without a registry support,
     * it's a advanced usage
     * 
     * @param address network address of the target jigsaw
     * @param path_str path_str is like 'JGNAME:PORTNAME'
     * @param data data should be a pure-json-object
     */
    call(address:AddressInfo,path_str:string,data?: any):Promise<any>;

    /**
     * 
     * This API will add a middleware into jigsaw,
     * so if a invoking arrived, it will be handled by
     * these middlewares.
     * 
     * 
     * @param handler handler must be a function
     * * first param is the context, and 
     * the second param is Next Function
     * 
     * @param hash hash is a string key to ensure middlewares wouldn't be added twice.
     * * the middlewares with same hash key
     * can be added always one time.
     * 
     */
    use(handler:UseWare,hash?:string) : void;

    /**
     * 
     * This API will add a pre-handler into jigsaw,
     * so if you start a invoking request, the request data
     * will pass these pre-handlers firstly.
     * 
     * @param handler handler must be a function
     * * first param is the context, and 
     * the second param is Next Function
     * 
     * @param hash hash is a string key to ensure pre-handlers wouldn't be added twice.
     * * the pre-handlers with same hash key
     * can be added always one time.
     * 
     */    
    pre(handler:PreWare,hash?:string) : void;

    /**
     * 
     * This API will add a post-handler into jigsaw,
     * so if you finished a invoking request, the result data
     * will pass these post-handlers firstly.
     * 
     * @param handler handler must be a function
     * * first param is the context, and 
     * the second param is Next Function
     * 
     * @param hash hash is a string key to ensure post-handlers wouldn't be added twice.
     * * the post-handlers with same hash key
     * can be added always one time.
     * 
     */    
    post(handler:PostWare,hash?:string) : void;

    /**
     * Get the network address the jigsaw binded to currently.
     */
    getAddress() : AddressInfo;
    
    /**
     * create a jigsaw port, this method actually create a middleware by ".use()" API.
     * but it's more simple to use.
     * 
     * @param port_name port name is like method name, other jigsaws can access this method by using this port name.
     * @param handler handler must be a function
     * * first param is the context, and 
     * the second param is Next Function
     * 
     */
    port(port_name:string,handler:(data:any,ctx:UseContext)=>any) : void;

    /**
     * close the jigsaw instance
     */
    close() : Promise<void>;
}

