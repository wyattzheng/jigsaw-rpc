import RegistryServer from "../network/domain/server/jigsaw/RegistryServer";

export interface RegistryServerAppConfig{
    bind_port: number;
}

export const DefaultRegistryServerAppConfig : RegistryServerAppConfig = {
    bind_port: 3793
}

export class RegistryServerApp{
    private config : RegistryServerAppConfig;
    constructor(config : RegistryServerAppConfig){
        this.config = config;
    }
    start(){
        new RegistryServer(this.config.bind_port);
    }
}