import { join } from "path";
import { PassThrough, Readable, Transform } from "stream";
import { transpose, Transposer } from "./_mat";
import { data } from "./data.interface";
import { logger } from "./log";
import { matmul } from "./_mat";
import { reader } from "./_reader";
import { add, multiply, sub } from "./_basic";
import { changeId, Increment, increment, mulwith } from "./_transform_utils";
import { applyfn } from "./_apply_fn";
import { reLU, reLUprime, sig, sigPrime } from "../activations";
import { genRan, genVals } from "./_gen";

class Dense{
    public w = new PassThrough({objectMode:true, highWaterMark:1});
    public b = new PassThrough({objectMode:true, highWaterMark:1});

    
    private memory = {
        0:new PassThrough({objectMode:true, highWaterMark:10}),
        1:new PassThrough({objectMode:true, highWaterMark:10}),

        2:new PassThrough({objectMode:true, highWaterMark:10}),// w
        3:new PassThrough({objectMode:true, highWaterMark:10}) // b
    }

    constructor(){
        genRan([2, 5]).pipe(this.w, {end:false});
        genRan([1, 2]).pipe(this.b, {end:false});

        this.w.pipe(this.memory[2]);
        this.b.pipe(this.memory[3]);
    }

    feed(a:Readable|Transform){
        a.pipe(this.memory[0]);

        const wt = transpose(this.w);
        const mat = matmul(
            changeId(a, 0), 0,
            changeId(wt, 1), 1
        );

        const added = add(
            changeId(mat, 0), 0, 
            changeId(this.b, 1), 1
        )

        added.pipe(this.memory[1]);
        return applyfn(added, sig);
    }

    back(grad:Readable|Transform){

        const rp = applyfn(this.memory[1], sigPrime);
        const ad = multiply(changeId(grad, 0), 0, changeId(rp, 1), 1);
        const gradb = sub(changeId(this.memory[3], 0), 0, changeId(mulwith(ad, 0.04), 1), 1);
        
        const at = transpose(this.memory[0]);
        const md = matmul(changeId(at, 0), 0, changeId(ad, 1), 1);      
        const gradw = sub(changeId(this.memory[2], 0), 0, changeId(mulwith(md, 0.04), 1), 1);   
        
        gradw.pipe(new Transform({objectMode:true, highWaterMark:1, transform(d, e, n){
            const data = JSON.parse(JSON.stringify(d));
            data.iteration += 1;
            this.push(data);
            n();
        }})).pipe(new Transposer()).pipe(this.w);
        gradb.pipe(new Transform({objectMode:true, highWaterMark:1, transform(d, e, n){
            const data = JSON.parse(JSON.stringify(d));
            data.iteration += 1;
            this.push(data);
            n();
        }})).pipe(this.b);
    }

    compare(result:Readable|Transform, output:Readable|Transform){
        return sub(changeId(result, 0), 0, changeId(output, 1), 1);
    }
}

// const a = reader(join(__dirname, "/ia.json"), [1, 5]);
// const output = reader(join(__dirname, "/ioutput.json"), [1, 2]);

const a = genVals(1, [1, 5], 10000);
const output = genVals(0, [1, 2], 10000);

const dense = new Dense();
const result = dense.feed(a)
const err = dense.compare(result, output);
dense.back(err);

result.pipe(logger("result", true, 1000))
