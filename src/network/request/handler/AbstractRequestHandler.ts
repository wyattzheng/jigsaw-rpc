import AbstractRequestSwitch = require("../switch/AbstractRequestSwitch");

abstract class AbstractRequestHandler{
    private rswitch : AbstractRequestSwitch;
    constructor(rswitch : AbstractRequestSwitch){
        this.rswitch = rswitch;
    
        
    }

}

export = AbstractRequestSwitch;
