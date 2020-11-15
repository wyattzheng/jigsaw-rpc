# Jigsaw-RPC

<div>

[English](https://github.com/ZhyMc/jigsaw-rpc/blob/master/README.md) | [中文](https://github.com/ZhyMc/jigsaw-rpc/blob/master/README-zh.md)

</div>

<br/>


[![Build Status](https://www.travis-ci.org/ZhyMC/jigsaw-rpc.svg?branch=master)](https://www.travis-ci.org/ZhyMC/jigsaw-rpc)
[![codecov](https://codecov.io/gh/ZhyMC/jigsaw-rpc/branch/master/graph/badge.svg?token=MEXBYVKXAW)](https://app.codecov.io/gh/ZhyMC/jigsaw-rpc)
[![npm version](https://badge.fury.io/js/jigsaw-rpc.svg)](https://npmjs.org/package/jigsaw-rpc)

jigsaw-rpc is an RPC framework written in TypeScript, it implements RPC used completely Node.js Socket API to ensure the performance of calling a remote method.

The API of jigsaw-rpc is designed to easy to use.

And the project is **Expandable and Maintainable**, so your contribution is welcome.

## Install

in a npm project folder, run:
```
npm install jigsaw-rpc --save
```
## Easy-to-start Sample

serv.js
```
const { RPC } = require("jigsaw-rpc");
new RPC.registry.Server();

let jg = RPC.GetJigsaw({ name :"calculator" });

jg.port("add",({a,b})=>{
    return {
        msg:"Hello, World!",
        result:a + b,
        date:new Date().toString()
    }
});
```

app.js
```
const { RPC } = require("jigsaw-rpc");

let jg = RPC.GetJigsaw();
jg.send("calculator:add",{ a:3, b:7 }).then((res)=>{
    console.log(res);
})
```

then run this two scripts:

You will get this output
```
{
    msg: "Hello World!",
    result: 10,
    date:'--Now Date String--'
}
```

## Advanced Sample

```
const { RPC } = require("jigsaw-rpc");
new RPC.registry.Server();

let jg = RPC.GetJigsaw({ name : "calculator" });

jg.use(async (ctx,next)=>{

    if(ctx.method == "add"){
        ctx.calc = ( x , y )=>( x + y );
    }else if(ctx.method == "mul"){
        ctx.calc = ( x , y )=>( x * y );
    }else if(ctx.method == "sub"){
        ctx.calc = ( x , y )=>( x - y );
    }else if(ctx.method == "div"){
        ctx.calc = ( x , y )=>( x / y );
    }else 
        throw new Error("the calculator don't support this method");

    await next();
});

jg.use(async (ctx,next)=>{

    let { x , y } = ctx.data;
    ctx.result = ctx.calc( x , y );

    await next();
})


/* 
    ↓ following codes can be run on another computer 

    or they can be togther as one script file.
*/

let invoker = RPC.GetJigsaw();
invoker.on("ready",async ()=>{

    console.log(await invoker.send("calculator:add",{x:100,y:500}));
    //this will output 600;

    console.log(await invoker.send("calculator:mul",{x:100,y:500}));
    //this will output 50000;

    console.log(await invoker.send("calculator:sub",{x:100,y:500}));
    //this will output -400;

    console.log(await invoker.send("calculator:div",{x:100,y:500}));
    //this will output 0.2;

});


```

## High Performance

Jigsaw implemented through Node.js Socket API completely.

> A single Jigsaw instance can almost transfer 1000 requests/sec, 20MB/s data with low latency in LAN on a x86, Intel i5-8250, GBE Network Card computer.
> 

## Simple API Document

### 1.  GetJigsaw({ name :string, entry :string, registry :string }) : Jigsaw

> **jigsaw name** is a path about how to access this jigsaw, network address and jigsaw name will both sync to registry.


the **name** is the **jigsaw name** which is a property of the return instance. 

**entry** is a network address string like "8.8.8.8:1234", this address described how to access this jigsaw from remote. so if this jigsaw work on Internet, this address must be a Internet Address.

jigsaw will listen on the port number like '1234' you provided, if you don't want to specified a exact number, just set **entry** like "127.0.0.1" without port string.

**registry** is a **URL** of the Network Address of the Jigsaw Domain Registry. The format is like "jigsaw://127.0.0.1:3793/"

You can create a registry like this:
```
new RPC.registry.Server(3793)
```

So GetJigsaw() 's calling format is like:

```
let jg = RPC.GetJigsaw("iamjigsaw","127.0.0.1","jigsaw://127.0.0.1:3793/")
```

All the params has default value, if you just want this jigsaw work on Local Network: 
```
let jg = RPC.GetJigsaw()
```

### 2. Registry.Server.prototype.constructor(bind_port:number,bind_address?:address)

Create a Jigsaw Registry Server, in a domain of a group of jigsaw-es , create one Server at least.

```
new RPC.registry.Server(3793)
```


### 3. Jigsaw


### 3.1 Jigsaw.prototype.send( path :string , data :object) : Promise(object)

call this method to invoke a remote jigsaw's method.

the **path** must be a correct **Jigsaw Path** format:

```
JigsawName:port_name
```

the **data** must be a **JSON-Serializable JavaScript Object** which doesn't contain any 'undefined' of a 'Function' and some other properties.


### 3.2 Jigsaw.prototype.port( port_name :string , handler:(data:object)=>Promise(object)) : void

register a **Jigsaw Port** that will handle all invoking requests to this Port.

Actually, **port_name** is the method name, and the handler is the function you will receive the invoke object and returning the object you want to reply.

**handler** can be a Async Function if you want to.


```
...

const wait = require("util").promisify(setTimeout);

let jgA = RPC.GetJigsaw({name : "A"});
let jgB = RPC.GetJigsaw({name : "B"});

jgA.port("call",async ()=>{

    console.log("recv an invoke,start to wait...");
    await wait(3000);
    console.log("done!");

    return {hello:"world"};
})

jgB.send("A:call",{}).then(console.log);
```


> this **data** object can be 1MB or even bigger.

### 3.3 Jigsaw.prototype.use(handler : (context:Object,next:Function) => Promise(object) )

this method create a middle-ware of a jigsaw. to handle all requests one by one.


a context contains these base properties:

```
{
    result: object, 
    /* if all middle-ware passed, the 'result' will send back to the invoker,
        'result' will be {} as the default value.
    */

    method: string , // the method name sender want to call
    data: object | Buffer, // the data from sender
    sender: string, // sender's jigsaw name
    isJSON: boolean, // if the 'data' is JSON-object or Buffer
    rawdata: Buffer, // the raw buffer of data
    jigsaw: Jigsaw // the jigsaw instance
}
```

the usage of this method is like:
```

let jg = RPC.GetJigsaw({ name:"serv" })

jg.use(async (ctx,next)=>{
    /*
        middle-ware codes here
    */

    await next();
})

```

**handler** can be a Async Function if you want to.

## Test

This project use mocha test framework, run:

```
npm test
```
at the project folder to do tests

you can also run:
```
npm run test-cov
```
to check the coverage of test cases

## LICENSE

This project is open-source under GPL-2.0 license.

## Contribution💗

Your contribution is welcome, follow this steps

```
1. Fork this repository
2. Modify the codes, or write a mocha test case
3. Commit using 'cz-conventional-changelog'
4. Start a Pull Request
```

Or just create an issue.