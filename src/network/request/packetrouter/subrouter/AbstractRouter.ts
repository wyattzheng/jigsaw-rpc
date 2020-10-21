import RouterRule = require("./RouterRule");
import Packet = require("../../../protocol/Packet");
import AbstractNetworkClient = require("../../../AbstractNetworkClient");
import IRouter = require("./IRouter");
import HandlerRef = require("./HandlerRef");

import assert = require("assert");
import HandlerMap = require("../../../../utils/HandlerMap");

type Handler = (pk:Packet)=>void;

abstract class AbstractRouter extends HandlerMap<Handler> implements IRouter{
    public static rule : RouterRule;
    
    public abstract getRule():RouterRule;
    public abstract handlePacket(pk : Packet) : void;
}

export = AbstractRouter;