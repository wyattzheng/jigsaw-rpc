const meow = require("meow");
const { execSync,spawn, spawnSync } = require("child_process")
const package = require("../package.json");

const cli = meow(`
    to deploy the project, you should specify params firstly

    Usage:
        --version, specify the version you want to deploy
`,{
    flags:{
        version:{
            type:"string",
            isRequired:true
        }
    }
});

function isDockerServiceRunning(serv_name){
    try{
        execSync(`docker service inspect ${serv_name}`,{stdio:[null,null]});
        return true;
    }catch(err){
        return false;
    }
}
function isDockerConfigExists(config_name){
    try{
        execSync(`docker config inspect ${config_name}`,{stdio:[null,null]});
        return true;
    }catch(err){
        return false;
    }
}
function updateServiceImage(serv_name,image_name){
    let proc = spawn(`docker`,['service','update',"-d",'--image',image_name,serv_name]);
    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);
    
    proc.on("exit",(code)=>{
        if(code != 0)
            throw new Error(`exited with code ${code}`)
    })
}
function createService(serv_name,image_name,expose_ports,config_name){
    let ports_param = [];
    for(const port of expose_ports){
        ports_param.push("--publish", `${port}:${port}/tcp`, "--publish", `${port}:${port}/udp`);
    }
    let proc = spawn(`docker`,['service','create',"-d",'--config',`source=${config_name},target=/etc/app.conf`,'--name',serv_name,...ports_param,image_name]);
    proc.stdout.pipe(process.stdout)
    proc.stderr.pipe(process.stderr)
    proc.on("exit",(code)=>{
        if(code != 0)
            throw new Error(`exited with code ${code}`)
    })

}

function runScript(){
    const build_tag = cli.flags.version;

    const serv_name = package.name.replace(/\./g,"_");

    const expose_port = package.config.expose_port;
    const image_name = `${package.config.org}/${serv_name}:${package.version}-${build_tag}`;
    const config_name = `config-${serv_name}`;
    
    if(!isDockerConfigExists(config_name))
        throw new Error(`You must create docker config named '${config_name}' first!`);
    
    if(isDockerServiceRunning(serv_name)){
        console.log(`Detected that service ${serv_name} is running, start to update image`);
    
        updateServiceImage(serv_name,image_name);
    }else{
        console.log(`Detected that service ${serv_name} isn't running, create a new service`);
    
        createService(serv_name,image_name,[expose_port],config_name);
    }

}

runScript();