import Jigsaw from "../../../src/jigsaw/SimpleJigsaw";


import RegistryRoute from "../../../src/network/router/route/RegistryRoute";
import UDPSocket from "../../../src/network/socket/UDPSocket";
import SimplePacketRouter from "../../../src/network/router/packetrouter/SimplePacketRouter";
import InvokeHandler from "../../../src/network/handler/InvokeHandler";
import InvokeRequest from "../../../src/network/request/InvokeRequest";
import BuilderNetworkClient from "../../../src/network/client/BuilderNetworkClient";
import RegistryResolver from "../../../src/network/domain/client/RegistryResolver";
import RegistryUpdater from "../../../src/network/domain/client/RegistryUpdater";

import PacketBuilderManager from "../../../src/network/protocol/builder/manager/PacketBuilderManager";

function GetMockJigsaw(option:any,mocked_modules:any){
    let modules : any = {
        DefaultRoute:RegistryRoute,
        Socket:UDPSocket,
        PacketRouter:SimplePacketRouter,
        InvokeHandler:InvokeHandler,
        InvokeRequest:InvokeRequest,
        NetworkClient:BuilderNetworkClient,
        RegistryResolver:RegistryResolver,
        RegistryUpdater:RegistryUpdater,
        BuilderManager:PacketBuilderManager
    };
    for(let i in mocked_modules){
        modules[i] = mocked_modules[i];
    }
    return new Jigsaw(option,modules);
}

export default GetMockJigsaw;
