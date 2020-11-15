import LifeCycle from "../../utils/LifeCycle";

interface IRequest<T>{
    getName() : string;
    run() : Promise<T>;
    getRequestId() : string;
    getLifeCycle() : LifeCycle;
    
    getResultType() : number;
    getResult() : T;
}

export default IRequest;
