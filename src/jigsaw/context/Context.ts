import {PreBaseContext,UseBaseContext,PostBaseContext} from "./BaseContext";

type Context = {
    [key:string] : any;
}

type PreContext = PreBaseContext & Context;
type UseContext = UseBaseContext & Context;
type PostContext = PostBaseContext & Context;

export {PreContext,UseContext,PostContext};

