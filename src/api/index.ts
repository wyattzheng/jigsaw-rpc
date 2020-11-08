import RegistryServer from "../network/domain/server/RegistryServer";
import VariableOption from "../jigsaw/option/VariableOption";
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
    let opt = VariableOption.from(option);
    return new LibContext.jigsawClass(opt);
};

export default RpcApi;

