import RegistryServer from "../network/domain/server/jigsaw/RegistryServer";

import { GetJigsaw, pre, use, post } from "./GetJigsaw";

import { JigsawCall } from "../tools/JigsawCall";


const RegistryApi = {
    Server : RegistryServer,
}

const RPCApi = {
    call : JigsawCall,
    registry : RegistryApi,
    GetJigsaw : GetJigsaw,
    pre : pre,
    use : use,
    post : post,
}

export default RPCApi;


