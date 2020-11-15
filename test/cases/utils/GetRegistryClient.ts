import BaseNetworkClient from "../../../src/network/client/BaseNetworkClient";
import AddressInfo from "../../../src/network/domain/AddressInfo";
import RegistryClient from "../../../src/network/domain/client/RegistryClient";
import RegistryServerInfo from "../../../src/network/domain/RegistryServerInfo";
import PacketFactory from "../../../src/network/protocol/factory/PacketFactory";
import SimplePacketRouter from "../../../src/network/router/packetrouter/SimplePacketRouter";
import ISocket from "../../../src/network/socket/ISocket";
import RandomGen from "../../../src/utils/RandomGen";


export default function getRegistryClient(socket:ISocket ,name:string){
    
    let client = new BaseNetworkClient(socket,new PacketFactory());

    let router = new SimplePacketRouter(client);
    let port = client.getAddressInfo().port;
    let domclient = new RegistryClient(RandomGen.GetRandomHash(8),name,new AddressInfo("127.0.0.1",port),new RegistryServerInfo("jigsaw","127.0.0.1",3793),router);

    return domclient;
}