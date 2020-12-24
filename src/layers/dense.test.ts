import { join } from "path";
import * as fs from "graceful-fs"

import { CrossEntropyfn } from "../core/transforms/costfn";
import { Counter, LineParser, LineStringify } from "../core/transforms/_transform_utils";
import { Dense } from "./dense"
import { GenValsNormal } from "../core/transforms/_gen";
import { formatMemory, log, logfn } from "../core/transforms/log";
import { AllowOnly } from "../../dist_ts/core/transforms/log";
import { OneShotMemory } from "../core/transforms/_memory";
import { Readable } from "stream";

let len = 1000;

let inputs:Readable[] = [];
let outputs:Readable[] = [];

for (let i = 0; i < 2; i++) {
    inputs.push(GenValsNormal([1], [1, len], i));
    outputs.push(GenValsNormal([1], [1, len], i));
}

function create(
    layers:Dense[],
    i = 0
) {
    if(!inputs[i]) return;

    let ip:any = inputs[i];
    layers.forEach(layer => {
        ip = layer.feed(ip);
    })

    ip.pipe(AllowOnly("index", 10)).pipe(logfn((data)=>{
        console.log(
                    "iteration:",data.iteration,
                    "index:",data.index, 
                    "Memory Usage:", formatMemory(process.memoryUsage().heapUsed),"MB"
                )
    }))
    let grad = CrossEntropyfn().delta(ip, outputs[i]);

    const co = new Counter("grad")
    
    grad.pipe(co).pipe(new LineStringify()).pipe(fs.createWriteStream(join(__dirname, "/grad.txt")));

    co.emitter.once("finished", ()=>{
        console.log("wr finished")
    
        let op:any = fs.createReadStream(join(__dirname, "/grad.txt")).pipe(new LineParser());
        for (let l = layers.length - 1; l >= 0; l--) {            
            op = layers[l].back(op);
        }
        
        const ca = new Counter("grada")
    
        op.pipe(ca).pipe(log(false));

        ca.emitter.once("finished", ()=>{
            create(layers, i+1);
        })
    })
}