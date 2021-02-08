import BaseNetworkClient from "../../../src/network/client/BaseNetworkClient";
import INetworkClient from "../../../src/network/client/INetworkClient";
import AddressInfo from "../../../src/network/domain/AddressInfo";
import QueryCacheStorage from "../../../src/network/domain/client/QueryCacheStorage";
import RegistryResolver from "../../../src/network/domain/client/RegistryResolver";
import RegistryUpdater from "../../../src/network/domain/client/RegistryUpdater";
import RegistryServerInfo from "../../../src/network/domain/RegistryServerInfo";
import PacketFactory from "../../../src/network/protocol/factory/PacketFactory";
import SimplePacketRouter from "../../../src/network/router/packetrouter/SimplePacketRouter";
import ISocket from "../../../src/network/socket/ISocket";


export function getClient(socket:ISocket){
    let client = new BaseNetworkClient(socket,new PacketFactory());

    return client;
}
export function getRegistryResolver(client:INetworkClient){

    let router = new SimplePacketRouter(client);
    
    let resolver = new RegistryResolver(new RegistryServerInfo("jigsaw","127.0.0.1",3793),router,new QueryCacheStorage());

    return resolver;
}

export function getRegistryUpdater(client:INetworkClient ,name:string, entry_port:number){
    
    let router = new SimplePacketRouter(client);
    
    let updater = new RegistryUpdater(name,name,new AddressInfo("127.0.0.1",1234),new RegistryServerInfo("jigsaw","127.0.0.1",3793),router);

    return updater;
}
