import AbstractRequestSwitch = require("../packetrouter/AbstractPacketRouter");

abstract class AbstractRequestHandler{
    private rswitch : AbstractRequestSwitch;
    constructor(rswitch : AbstractRequestSwitch){
        this.rswitch = rswitch;
    
        
    }

}

export = AbstractRequestSwitch;
