import AddressInfo = require("../network/domain/AddressInfo");
import Jigsaw = require("../jigsaw/SimpleJigsaw");
const getPortSync = require('get-port-sync');

function GetJigsaw(
    jgname:string,
    entry_address:string = "127.0.0.1",
    domserver_address:string="127.0.0.1"
) : Jigsaw{

    let entry_port = getPortSync() as number;
    return new Jigsaw(jgname,new AddressInfo(entry_address,entry_port),new AddressInfo(domserver_address,3793));
};

export = GetJigsaw;

