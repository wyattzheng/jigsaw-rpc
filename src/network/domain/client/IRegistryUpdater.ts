import { TypedEmitter } from "tiny-typed-emitter";
import LifeCycle from "../../../utils/LifeCycle";

export interface UpdaterEvent{
    error:(err : Error)=>void;
};

export interface IRegistryUpdater extends TypedEmitter<UpdaterEvent>{
    getLifeCycle():LifeCycle;
    close():Promise<void>
}