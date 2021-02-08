import IRequest from "../network/request/IRequest";
import INetworkClient from "../network/client/INetworkClient";
import IBuilderManager from "../network/protocol/builder/manager/IBuilderManager";
import SlicePacket from "../network/protocol/packet/SlicePacket";
import IPacket from "../network/protocol/IPacket";
import IRoute from "../network/router/route/IRoute";
import IRouter from "../network/router/IRouter";
import ISocket from "../network/socket/ISocket";
import IHandler from "../network/handler/IHandler";

import { IRegistryUpdater } from "../network/domain/client/IRegistryUpdater";
import { IRegistryResolver } from "../network/domain/client/IRegistryResolver";

interface Option {
    [key:string]:any;
}
interface BaseOption {
    name?: string,
    entry?: string,
    registry?: string,
    port? : number,
    disable_updater? : boolean
}

interface JigsawModuleOption {
    Socket:new (...args:any[])=> ISocket,
    PacketRouter:new (...args:any[])=> IRouter,
    InvokeHandler:new (...args:any[])=> IHandler,
    InvokeRequest:new (...args:any[])=> IRequest<Buffer>,
    NetworkClient:new (...args:any[])=> INetworkClient,
    RegistryUpdater:new (...args:any[]) => IRegistryUpdater,
    RegistryResolver:new (...args:any[]) => IRegistryResolver,
    BuilderManager:new (...args:any[]) => IBuilderManager<SlicePacket,IPacket>,
    DefaultRoute:new (...args:any[]) => IRoute,

};

type JigsawOption = BaseOption & Option;

export {JigsawOption,JigsawModuleOption};