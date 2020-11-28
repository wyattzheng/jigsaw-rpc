import IRequest from "../network/request/IRequest";
import INetworkClient from "../network/client/INetworkClient";
import IBuilderManager from "../network/protocol/builder/manager/IBuilderManager";
import SlicePacket from "../network/protocol/packet/SlicePacket";
import IPacket from "../network/protocol/IPacket";
import IRegistryClient from "../network/domain/client/IRegistryClient";
import IRoute from "../network/router/route/IRoute";
import IRouter from "../network/router/IRouter";
import ISocket from "../network/socket/ISocket";
import IHandler from "../network/handler/IHandler";

interface Option {
    [key:string]:any;
}
interface BaseOption {
    name?: string,
    entry?: string,
    registry?: string,
    port? : number
}

interface JigsawModuleOption {
    Socket:new (...args:any[])=> ISocket,
    PacketRouter:new (...args:any[])=> IRouter,
    InvokeHandler:new (...args:any[])=> IHandler,
    InvokeRequest:new (...args:any[])=> IRequest<Buffer>,
    NetworkClient:new (...args:any[])=> INetworkClient,
    RegistryClient:new (...args:any[]) => IRegistryClient,
    BuilderManager:new (...args:any[]) => IBuilderManager<SlicePacket,IPacket>,
    DefaultRoute:new (...args:any[]) => IRoute,

};

type JigsawOption = BaseOption & Option;

export {JigsawOption,JigsawModuleOption};