
const CLI = require("config-style-cli");
const { RegistryServerApp , DefaultRegistryServerAppConfig } = require("../lib");

CLI([
    RegistryServerApp,
    DefaultRegistryServerAppConfig
]);
