import { createReadStream, createWriteStream } from "fs";
import { join } from "path";
import { Readable, Transform } from "stream";
import { sig, sigPrime } from "../core/activations";
import { apply_act } from "../core/apply_act";
import { add } from "../core/basic";
import { logger } from "../core/log";
import { matmul2d, transpose } from "../core/mat";
import { _cstep } from "../core/transforms/_mat";
import { genDetails, vertex } from "../core/vertex";
import { dense } from "../layers/dense"
import { comparator, construct } from "./comparator";

console.time("t")
let t = 0;
let i = 0;
const ip = new Readable({objectMode:true})
ip._read = () => {
    const r = ip.push([t, 1, 0, i])
    
    if(t >= 10){
        t = 0;
        i++; 
    }else{
        t++;
    }
    
    if(i > 10000) ip.push(null);
};


let t1 = 0;
let i2 = 0;
const op = new Readable({objectMode:true})
op._read = () => {
    const r = op.push([t1, 1, 1, i2])
    if(r == false) console.log(r)
    if(t1 == 1) i2 += 1;    
    t1 = t1 == 0 ? 1 : 0;
    
    if(i2 > 1) op.push(null);
};


const input = new vertex(ip, {id:0, shape:[1, 10], step:[10, 1] });
const output = new vertex(op, {id:1, shape:[1, 10], step:[10, 1]});

const dense_ = dense(10, 1, {objectMode:true, highWaterMark:100000});
const res = dense_.feed(input);
construct(res);
comparator(res, output);

class sequential{
    private layer = [];
    constructor(){
        
    }
}