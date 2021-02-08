import RegistryServer from "../network/domain/server/jigsaw/RegistryServer";

import { GetJigsaw, pre, use, post } from "./GetJigsaw";

const RegistryApi = {
    Server : RegistryServer,
}

const RPCApi = {
    registry : RegistryApi,
    GetJigsaw : GetJigsaw,
    pre : pre,
    use : use,
    post : post,
}

export default RPCApi;


