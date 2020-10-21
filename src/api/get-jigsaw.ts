import AddressInfo = require("../network/domain/AddressInfo");
import Jigsaw = require("../jigsaw/SimpleJigsaw");
import DomainServer = require("../network/domain/server/DomainServer");
const getPortSync = require('get-port-sync');

function GetJigsaw(
    jgname:string,
    entry_address:string = "127.0.0.1",
    domserver_address:string = "127.0.0.1"
) : Jigsaw{

    let entry_port = getPortSync() as number;
    return new Jigsaw(jgname,new AddressInfo(entry_address,entry_port),new AddressInfo(domserver_address,3793));
};

function createDomainServer(){
    return new DomainServer(3793,"0.0.0.0");
}

export = function(entry_address="127.0.0.1",domserver_address:string="127.0.0.1"){
    return {
        jigsaw : function(jgname:string){return GetJigsaw(jgname,entry_address,domserver_address)},
        domainserver:createDomainServer,
        createDomainServer,
        Jigsaw
    }
}

