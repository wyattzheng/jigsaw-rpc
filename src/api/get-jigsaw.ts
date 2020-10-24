import AddressInfo = require("../network/domain/AddressInfo");
import Jigsaw = require("../jigsaw/SimpleJigsaw");
import DomainServer = require("../network/domain/server/DomainServer");

function GetJigsaw(
    jgname:string,
    entry_address:string = "127.0.0.1",
    domserver_address:string = "127.0.0.1"
) : Jigsaw{

    return new Jigsaw(jgname,entry_address,new AddressInfo(domserver_address,3793));
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

