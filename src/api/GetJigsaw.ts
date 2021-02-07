import IJigsaw from "../jigsaw/IJigsaw";
import SimpleJigsaw from "../jigsaw/SimpleJigsaw";

import RegistryRoute from "../network/router/route/RegistryRoute";
import UDPSocket from "../network/socket/UDPSocket";
import SimplePacketRouter from "../network/router/packetrouter/SimplePacketRouter";
import InvokeHandler from "../network/handler/InvokeHandler";
import InvokeRequest from "../network/request/InvokeRequest";
import BuilderNetworkClient from "../network/client/BuilderNetworkClient";
import RegistryResolver from "../network/domain/client/RegistryResolver";
import RegistryUpdater from "../network/domain/client/RegistryUpdater";
import PacketBuilderManager from "../network/protocol/builder/manager/PacketBuilderManager";

import { JigsawOption } from "../jigsaw/JigsawOption";
import { PostWare, PreWare, UseWare } from "../jigsaw/JigsawWare";

type DefaultWare = {
    use:Array<UseWare>,
    pre:Array<PreWare>,
    post:Array<PostWare>
};


const LibContext : {
    default_ware:DefaultWare
} = {
    default_ware:{
        use:[],
        pre:[],
        post:[]
    }
};


export function use(work:UseWare) : void{
    LibContext.default_ware.use.push(work);
}
export function pre(work:PreWare) : void{
    LibContext.default_ware.pre.push(work);
}
export function post(work:PostWare) : void{
    LibContext.default_ware.post.push(work);
}

export function GetJigsaw(option? : JigsawOption) : IJigsaw{
    
    let jigsaw = new SimpleJigsaw(option || {},{
        DefaultRoute:RegistryRoute,
        Socket:UDPSocket,
        PacketRouter:SimplePacketRouter,
        InvokeHandler:InvokeHandler,
        InvokeRequest:InvokeRequest,
        NetworkClient:BuilderNetworkClient,
        RegistryResolver: RegistryResolver,
        RegistryUpdater: RegistryUpdater,
        BuilderManager:PacketBuilderManager
    });

    for(let use_ware of LibContext.default_ware.use){
        jigsaw.use(use_ware);
    }
    for(let pre_ware of LibContext.default_ware.pre){
        jigsaw.pre(pre_ware);
    }
    for(let post_ware of LibContext.default_ware.post){
        jigsaw.post(post_ware);
    }

    return jigsaw;
};