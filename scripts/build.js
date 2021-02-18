const meow = require("meow");
const {spawn} = require("child_process");
const package = require("../package.json");

const cli = meow(`
    to build the project, you should specify params firstly

    Usage:
        --version, specify the version tag you want to build to
`,{
    flags:{
        version:{
            type:"string",
            isRequired:true
        }
    }
});


const BUILD_TAG = cli.flags.version;

const serv_name = package.name.replace(/\./g,"_");
const image_name = `${package.config.org}/${serv_name}:${package.version}-${BUILD_TAG}`;

const builder = spawn('docker', ['build','-t',image_name,"."]);

builder.stdout.pipe(process.stdout);
builder.stderr.pipe(process.stderr);
