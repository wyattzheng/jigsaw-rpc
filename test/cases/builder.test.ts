import assert = require("assert");
import PacketBuilder from "../../src/network/protocol/builder/PacketBuilder";
import PacketFactory from "../../src/network/protocol/factory/PacketFactory";
import InvokePacket from "../../src/network/protocol/packet/InvokePacket";
import SlicePacket from "../../src/network/protocol/packet/SlicePacket";
import TestPacket from "../../src/network/protocol/packet/TestPacket";

describe("Builder Test",async function(){
    it("should throw error if a wrong sliceid packet send into builder",async function(){
        this.timeout(20*1000);
        let builder = new PacketBuilder(100,new PacketFactory());
        let error = false;
        for(let i=0;i<101;i++){
            let slice = new SlicePacket();
            slice.partid = i;
            slice.payload = Buffer.allocUnsafe(128);
            slice.partmax = 100;
            try{
                builder.addPart(slice);
            }catch(err){
                error = true;
            }
        }
        if(!error)
            throw new Error("never throw error");
        
    });
    it("should built correctly",async function(){
        this.timeout(20*1000);
        let testpk = new TestPacket();
        
        for(let i=0;i<100;i++){
            let buf = Buffer.allocUnsafe(4);
            buf.writeUInt16BE(i,0);

            testpk.testdata[i] = buf;
        }
        testpk.encode();
        let slicebuf = testpk.getSlicedData();
        let slices=slicebuf.length % 64 == 0 ?  slicebuf.length/64 : Math.floor(slicebuf.length/64)+1;

        let builder = new PacketBuilder(slices,new PacketFactory());

        for(let i=0;i<slices;i++){
            let slice = new SlicePacket();
            slice.partid = i;
            slice.partmax = slices;

            slice.payload = slicebuf.slice(i*64,(i+1)*64);

            assert.strictEqual(builder.whichPart(slice),i);
            builder.addPart(slice);

        }
        assert(builder.isDone(),"builder must be done right now");
        
        let built = builder.getData() as TestPacket;

        built.decode();
        assert.strictEqual(built.testdata.length,100);
    
        for(let i=0;i<built.testdata.length;i++){
            let digit = built.testdata[i].readUInt16BE(0);
            assert.strictEqual(digit,i);
        }
        
    });

})