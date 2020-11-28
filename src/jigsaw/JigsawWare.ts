import { PostContext, PreContext, UseContext } from "./context/Context";

type NextFunction = ()=>Promise<void>;

type UseWare = (ctx:UseContext,next:NextFunction)=>Promise<void>;
type PreWare = (ctx:PreContext,next:NextFunction)=>Promise<void>;
type PostWare = (ctx:PostContext,next:NextFunction)=>Promise<void>;

export {UseWare,PreWare,PostWare,NextFunction};
