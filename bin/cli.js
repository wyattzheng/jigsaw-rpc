
const CLI = require("config-style-cli");
const { ServiceApp, ServiceAppDefaultConfig } = require("../lib/index");

CLI([
    ServiceApp,
    ServiceAppDefaultConfig
]);
