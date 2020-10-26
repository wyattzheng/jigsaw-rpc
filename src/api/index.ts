import AddressInfo = require("../network/domain/AddressInfo");
import Jigsaw = require("../jigsaw/SimpleJigsaw");
import DomainServer = require("../network/domain/server/DomainServer");
import Url = require("url");

const DomainApi = {
    Server : DomainServer,
}
const RpcApi = {
    domain : DomainApi,
    Jigsaw : Jigsaw,
    GetJigsaw : GetJigsaw
}

type JigsawOption = {
    name? : string ,
    entry? : string ,
    registry? : string
}

function GetJigsaw(option : JigsawOption={}) : Jigsaw{
    
    let jgname = option.name || Jigsaw.getRandomName();

    let parsed_entry = AddressInfo.parse(option.entry || "127.0.0.1");
    let entry_address = parsed_entry.address;
    let entry_port : number | undefined = parsed_entry.port > 0 ? parsed_entry.port : undefined;

    let registry_url = Url.parse(option.registry || "jigsaw://127.0.0.1:3793/") as Url.Url;

    return new Jigsaw(jgname,entry_address,entry_port,registry_url);
};

export = RpcApi;

