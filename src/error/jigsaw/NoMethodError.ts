import JGError from "../JGError";

class NoMethodError extends JGError{
    constructor(){
        super(3201,"the jigsaw don't have this method");
        this.initMessage();
    }
    getName(){
        return "NoMethodError";
    }
    getDetail(){
        return "found this jigsaw, but can not call this method";
    }
}

export default NoMethodError;
