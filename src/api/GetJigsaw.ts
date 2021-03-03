import { IJigsaw } from "../jigsaw/IJigsaw";
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

/**
 * 
 * @param option.name jigsaw name
 * @param option.entry a address that will be registered on Jigsaw Registry
 * @param option.port a network port that jigsaw listen to, if you don't provide, it will be generated randomly
 * @param option.registry a url like 'jigsaw://127.0.0.1:3793/' describe the network address of Jigsaw Registry the jigsaw will register to.
 */
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
    
    return jigsaw;
};