import RegistryServer from "../network/domain/server/RegistryServer";
import IJigsaw from "../jigsaw/IJigsaw";
import SimpleJigsaw from "../jigsaw/SimpleJigsaw";

type JigsawClass = new(...args:any[]) => IJigsaw;

const LibContext :{
    jigsawClass : JigsawClass
} = {
    jigsawClass : SimpleJigsaw
}

const RegistryApi = {
    Server : RegistryServer,
}
const PluginApi = {

};

const RpcApi = {
    pluginApi : PluginApi,
    registry : RegistryApi,
    use : (cls : JigsawClass)=>{ LibContext.jigsawClass = cls },
    GetJigsaw : GetJigsaw
}

function GetJigsaw(option : object) : IJigsaw{
    return new LibContext.jigsawClass(option);
};

export default RpcApi;

