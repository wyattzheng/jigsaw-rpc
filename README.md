# Jigsaw-RPC

[![Build Status](https://www.travis-ci.org/ZhyMC/jigsaw-rpc.svg?branch=master)](https://www.travis-ci.org/ZhyMC/jigsaw-rpc)
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
const RPC = require("jigsaw-rpc");
new RPC.domain.Server();

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
const RPC = require("jigsaw-rpc");

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
new RPC.domain.Server(3793)
```

So GetJigsaw() 's calling format is like:

```
let jg = RPC.GetJigsaw("iamjigsaw","127.0.0.1","jigsaw://127.0.0.1:3793/")
```

All the params has default value, if you just want this jigsaw work on Local Network: 
```
let jg = RPC.GetJigsaw()
```

### 2. Jigsaw

### 2.1 Jigsaw.prototype.constructor( name :string , entry_address :string , entry_port :number , registry_path : URL) : Jigsaw

This is the original Jigsaw constructor, build an instance without the factory method 'GetJigsaw()'.

Notice that registry_path must use require("url").parse() to get the url object

### 2.2 Jigsaw.prototype.send( path :string , data :object) : Promise(object)

call this method to invoke a remote jigsaw's method.

the **path** must be a correct **Jigsaw Path** format:

```
JigsawName:port_name
```

the **data** must be a **JSON-Serializable JavaScript Object** which doesn't contain any 'undefined' of a 'Function' and some other properties.


### 2.3 Jigsaw.prototype.port( port_name :string , handler:(data:object)=>Promise(object)) : void

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

### 2.4 Jigsaw.prototype.handle(handler : (port_name:string,data:object)=>Promise(object))

if a invoke request doesn't match any **Jigsaw Port**, it can be caught through this method.

```
...

jg.port("call_1",()=>{});

jg.handle((port_name,data)=>{
    console.log(port_name,data);
    //output: call_2 {abc:123}
});

jg.send("call_2",{abc:123});

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
3. Commit using 'cz-convention-changelog'
4. Start a Pull Request
```
