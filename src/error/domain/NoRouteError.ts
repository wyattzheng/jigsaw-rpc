import JGError from "../JGError";

class NoRouteError extends JGError{
    constructor(){
        super(3101,"No Route to Target Path");
        this.initMessage();
    }
    getName(){
        return "NoRouteError";
    }
    getDetail(){
        return "Ensure that target jigsaw exists";
    }
}

export = NoRouteError;
