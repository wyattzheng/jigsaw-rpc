import AbstractDistributor = require("./AbstractDistributor");

class SimpleDistributor extends AbstractDistributor{
	private members : AbstractDistributee[] = new Array<AbstractDistributee>();
	constructor(){

	}
	public abstract addMember(member : AbstractDistributee) : void{
		this.members.push(member);
	}
	public abstract async distMessage(message : object) : void{
		try{
			
			for(let member of this.members)
				await member.onDistMsg(message);
		}catch(e : Error){
			console.error(e);
		}

	}


}

export = SimpleDistributor;
