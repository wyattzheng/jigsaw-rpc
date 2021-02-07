import BaseNetworkClient from "../../../src/network/client/BaseNetworkClient";
import AddressInfo from "../../../src/network/domain/AddressInfo";
import RegistryResolver from "../../../src/network/domain/client/RegistryResolver";
import RegistryUpdater from "../../../src/network/domain/client/RegistryUpdater";
import RegistryServerInfo from "../../../src/network/domain/RegistryServerInfo";
import PacketFactory from "../../../src/network/protocol/factory/PacketFactory";
import SimplePacketRouter from "../../../src/network/router/packetrouter/SimplePacketRouter";
import ISocket from "../../../src/network/socket/ISocket";
import RandomGen from "../../../src/utils/RandomGen";


export function getRegistryResolver(socket:ISocket){
    
    let client = new BaseNetworkClient(socket,new PacketFactory());

    let router = new SimplePacketRouter(client);
    
    let domclient = new RegistryResolver(new RegistryServerInfo("jigsaw","127.0.0.1",3793),router);

    return domclient;
}

export function getRegistryUpdater(socket:ISocket ,name:string, entry_port:number){
    
    let client = new BaseNetworkClient(socket,new PacketFactory());

    let router = new SimplePacketRouter(client);
    
    let domclient = new RegistryUpdater(name,name,new AddressInfo("127.0.0.1",1234),new RegistryServerInfo("jigsaw","127.0.0.1",3793),router);

    return domclient;
}
