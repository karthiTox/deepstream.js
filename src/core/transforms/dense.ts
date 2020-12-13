import { join } from "path";
import { PassThrough, Readable, Transform } from "stream";
import { transpose, Transposer } from "./_mat";
import { data } from "./data.interface";
import { AllowAt, logger } from "./log";
import { matmul } from "./_mat";
import { reader } from "./_reader";
import { add, multiply, sub } from "./_basic";
import { changeId, Increment, increment, mulwith } from "./_transform_utils";
import { Applyfn, applyfn } from "./_apply_fn";
import { reLU, reLUprime, sig, sigPrime } from "../activations";
import { genRan, genVals } from "./_gen";
import { Memory } from "./_memory";

class Dense{
    private lr = 1;
    public w = new PassThrough({objectMode:true, highWaterMark:1});
    public b = new PassThrough({objectMode:true, highWaterMark:1});

    
    private memory = {
        0:new Memory(),
        1:new Memory(),

        2:new Memory(),// w
        3:new Memory() // b
    }

    constructor(){
        genRan([2, 2]).pipe(this.w, {end:false});
        genRan([2, 2]).pipe(this.b, {end:false});

        this.w.pipe(this.memory[2].inline);
        this.b.pipe(this.memory[3].inline);
    }

    feed(a:Readable|Transform){
        a.pipe(this.memory[0].inline);

        const wt = transpose(this.w);
        const mat = matmul(
            changeId(a, 0), 0,
            changeId(wt, 1), 1
        );

        const added = add(
            changeId(mat, 0), 0, 
            changeId(this.b, 1), 1
        )
        
        
        added.pipe(this.memory[1].inline);

        return applyfn(added, sig);
    }

    back(grad:Readable|Transform){

        const rp = applyfn(this.memory[1].outline, sigPrime);
        const ad = multiply(changeId(grad, 0), 0, changeId(rp, 1), 1);
        const gradb = sub(changeId(this.memory[3].outline, 0), 0, changeId(mulwith(ad, this.lr), 1), 1);
        
        const at = transpose(this.memory[0].outline);
        const md = matmul(changeId(at, 0), 0, changeId(ad, 1), 1);      
        const gradw = sub(changeId(this.memory[2].outline, 0), 0, changeId(mulwith(md, this.lr), 1), 1);   
        
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
        const op = sub(changeId(result, 0), 0, changeId(output, 1), 1);        
        return op;
    }
}

// const a = reader(join(__dirname, "/ia.json"), [1, 5]);
// const output = reader(join(__dirname, "/ioutput.json"), [1, 2]);

const a = genVals([1], [2, 2], 10000);
const output = genVals([1, 0], [2, 2], 10000);

const dense = new Dense();
const result = dense.feed(a)
const err = dense.compare(result, output);
dense.back(err);

result.pipe(AllowAt("index", 2)).pipe(logger("result", true, 100))
