import RegistryServer from "../network/domain/server/jigsaw/RegistryServer";
import IJigsaw from "../jigsaw/IJigsaw";
import SimpleJigsaw from "../jigsaw/SimpleJigsaw";

import RegistryRoute from "../network/router/route/RegistryRoute";
import UDPSocket from "../network/socket/UDPSocket";
import SimplePacketRouter from "../network/router/packetrouter/SimplePacketRouter";
import InvokeHandler from "../network/handler/InvokeHandler";
import InvokeRequest from "../network/request/InvokeRequest";
import BuilderNetworkClient from "../network/client/BuilderNetworkClient";
import RegistryClient from "../network/domain/client/RegistryClient";
import PacketBuilderManager from "../network/protocol/builder/manager/PacketBuilderManager";

const RegistryApi = {
    Server : RegistryServer,
}


const RPCApi = {
    registry : RegistryApi,
    GetJigsaw : GetJigsaw
}


function GetJigsaw(option? : any) : IJigsaw{
    return new SimpleJigsaw(option || {},{
        DefaultRoute:RegistryRoute,
        Socket:UDPSocket,
        PacketRouter:SimplePacketRouter,
        InvokeHandler:InvokeHandler,
        InvokeRequest:InvokeRequest,
        NetworkClient:BuilderNetworkClient,
        RegistryClient: RegistryClient,
        BuilderManager:PacketBuilderManager
    });
};

export default RPCApi;


