
const CLI = require("config-style-cli");
const { RPC } = require("../lib");

CLI([
    RPC.service.RegistryServerApp ,
    RPC.service.DefaultRegistryServerAppConfig
]);
