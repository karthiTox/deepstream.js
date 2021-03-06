import { PassThrough, Readable, Transform } from "stream";
import { transpose, Transposer } from "../core/transforms/_mat";
import { matmul } from "../core/transforms/_mat";
import { add, multiply, sub } from "../core/transforms/_basic";
import { changeId, mulwith } from "../core/transforms/_transform_utils";
import { applyfn } from "../core/transforms/_apply_fn";
import { _activation, getActivation } from "../core/transforms/activations";
import { genRan, GenValsNormal } from "../core/transforms/_gen";
import { Memory } from "../core/transforms/_memory";
import { switcher } from "../core/transforms/_switcher";
import { Exporter, Controller } from "../core/transforms/exporter";
import { logfn } from "../core/transforms/log";

interface dense_options{
    prev_neurons:number, 
    neurons:number, 
    activation:_activation, 
    learningRate:number
}

export class Dense{
    
    public w = new PassThrough({objectMode:true, highWaterMark:1});
    public b = new PassThrough({objectMode:true, highWaterMark:1});

    
    private memory = {
        a:new Memory(),
        ib:new Memory(),
        added:new Memory(),

        w:new Memory(),// w
        b:new Memory(), // b
    }

    private activation;
    private lr;

    public controller = new Controller(100); 

    constructor(private options:dense_options, public id:number = 0){        
        this.activation = getActivation(options.activation);
        this.lr = options.learningRate;

        genRan([options.neurons, options.prev_neurons]).pipe(this.w, {end:false})        
        genRan([1, options.neurons]).pipe(this.b, {end:false})  

        this.w.pipe(this.memory.w.inline);
        this.b.pipe(this.memory.b.inline);   
    }

    feed(a:Readable|Transform){        
        a.pipe(this.memory.a.inline);

        const wt = transpose(this.w);
        wt.pipe(this.memory.ib.inline)
        const mat = matmul(
            changeId(a, 0), 0,
            changeId(wt, 1), 1,
        );

        const added = add(
            changeId(mat, 0), 0, 
            changeId(this.b, 1), 1
        )
        
        
        added.pipe(this.memory.added.inline);

        return applyfn(added, this.activation.fn);
    }

    back(grad:Readable|Transform){
        const rp = applyfn(this.memory.added.outline, this.activation.delta);
        const ad = multiply(changeId(grad, 0), 0, changeId(rp, 1), 1);                

        const gradb = sub(changeId(this.memory.b.outline, 0), 0, changeId(mulwith(ad, this.lr), 1), 1);

        const inter = changeId(transpose(this.memory.a.outline), 0)
        const md = matmul(inter, 0, changeId(ad, 1), 1);      
        const gradw = sub(changeId(this.memory.w.outline, 0), 0, changeId(mulwith(md, this.lr), 1), 1);           

        const grada = matmul(changeId(ad, 0), 0, changeId(transpose(this.memory.ib.outline), 1), 1);  

        const inc = () => new Transform({objectMode:true, highWaterMark:2, transform(data, e, next){            
            data.iteration += 1;
            this.push(data);
            next();
        }})

        const passerw = new PassThrough({objectMode:true, highWaterMark:1});
        const passerb = new PassThrough({objectMode:true, highWaterMark:1});

        gradw.pipe(inc()).pipe(new Transposer()).pipe(passerw, {end:false});

        gradb.pipe(inc()).pipe(passerb, {end:false});

        this.controller.addLine("w"+this.id, passerw, this.w);
        this.controller.addLine("b"+this.id, passerb, this.b);         

        return grada;
    }
}

export function dense(options:dense_options){
    return new Dense(options);
}