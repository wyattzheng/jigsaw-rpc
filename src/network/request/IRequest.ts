import LifeCycle from "../../utils/LifeCycle";

interface IRequest<T>{
    getName() : string;
    run() : Promise<T>;
    getRequestId() : string;
    getLifeCycle() : LifeCycle;

}

export default IRequest;
