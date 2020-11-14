import RegistryServer from "../network/domain/server/jigsaw/RegistryServer";
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


const RPCApi = {
    registry : RegistryApi,
    GetJigsaw : GetJigsaw
}


function GetJigsaw(option : any) : IJigsaw{
    return new LibContext.jigsawClass(option || {});
};

export default RPCApi;


