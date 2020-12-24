import { PassThrough, Readable, Transform, Writable } from "stream";
import * as fs from "fs";
import { transpose, Transposer } from "./_mat";
import { data } from "./data.interface";
import { matmul } from "./_mat";
import { reader } from "./_reader";
import { add, multiply, sub } from "./_basic";
import { changeId, Increment, increment, IterationCounter, LineStringify, mulwith } from "./_transform_utils";
import { applyfn } from "./_apply_fn";
import { genRan, genValues } from "./_gen";
import { Memory, OneShotMemory } from "./_memory";
import { join } from "path";
import * as os from "os";
import { Switcher, switcher } from "./_switcher";
import { _cstep, _findIndex } from "./utils";

const counter = new IterationCounter();

matmul(
    genValues([1], [1, 2], 1, 0), 0, 
    genValues([1], [2, 2], 1, 1), 1
)

counter.counter_emitter.on("finished", ()=>{
    console.log(counter.counts);
})

process.once("exit", ()=>{
    console.log(counter.counts)
    try {
        fs.rmdirSync(join(__dirname, "/temp_pool"), {recursive:true});
        console.log("temp_pool deleted")
    }catch{
        console.warn("temp_pool is not deleted")
    }
})
