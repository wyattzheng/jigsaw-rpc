import * as BaseContext from "./BaseContext";

interface Context {
    [key:string] : any;
}

type PreContext = BaseContext.PreBaseContext & Context;
type UseContext = BaseContext.UseBaseContext & Context;
type PostContext = BaseContext.PostBaseContext & Context;

export {PreContext,UseContext,PostContext,BaseContext};

