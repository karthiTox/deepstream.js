import { PassThrough, Readable, Transform } from "stream";
import { transpose, Transposer } from "../core/transforms/_mat";
import { matmul } from "../core/transforms/_mat";
import { add, multiply, sub } from "../core/transforms/_basic";
import { changeId, mulwith } from "../core/transforms/_transform_utils";
import { applyfn } from "../core/transforms/_apply_fn";
import { _activation, getActivation } from "../core/transforms/activations";
import { genRan } from "../core/transforms/_gen";
import { Memory } from "../core/transforms/_memory";


interface dense_options{
    prev_neurons:number, 
    neurons:number, 
    activation:_activation, 
    learningRate:number
}

export class Dense{
    
    public weights:Transform|Readable;
    public biases:Transform|Readable;

    private activation;
    private lr;

    constructor(op:dense_options){
        this.weights = genRan([op.neurons, op.prev_neurons]);
        this.biases = genRan([1, op.neurons]);

        this.activation = getActivation(op.activation);
        this.lr = op.learningRate
    }
    
    private memory:{
        [name:string]:Memory
    } = {}

    setup_memory(){
        this.memory = {
            a:new Memory(),
            b:new Memory(),
            added:new Memory(),

            weights:new Memory(),// w
            biases:new Memory(), // b
        }
    }

    feed(a:Readable|Transform){ 
        this.setup_memory();

        this.weights.pipe(this.memory.weights.inline);
        this.biases.pipe(this.memory.biases.inline);
        
        a.pipe(this.memory.a.inline);

        const wt = transpose(this.weights);
        wt.pipe(this.memory.b.inline)
        const mat = matmul(
            changeId(a, 0), 0,
            changeId(wt, 1), 1,
        );

        const added = add(
            changeId(mat, 0), 0, 
            changeId(this.biases, 1), 1
        )
        
        
        added.pipe(this.memory.added.inline);

        return applyfn(added, this.activation.fn);
    }

    back(grad:Readable|Transform){
        const rp = applyfn(this.memory.added.outline, this.activation.delta);
        const ad = multiply(changeId(grad, 0), 0, changeId(rp, 1), 1);                

        const gradb = sub(changeId(this.memory.biases.outline, 0), 0, changeId(mulwith(ad, this.lr), 1), 1);

        const inter = changeId(transpose(this.memory.a.outline), 0)
        const md = matmul(inter, 0, changeId(ad, 1), 1);      
        const gradw = sub(changeId(this.memory.weights.outline, 0), 0, changeId(mulwith(md, this.lr), 1), 1);           

        const grada = matmul(changeId(ad, 0), 0, changeId(transpose(this.memory.b.outline), 1), 1);  

        const inc = () => new Transform({objectMode:true, highWaterMark:2, transform(data, e, next){            
            data.iteration += 1;
            this.push(data);
            next();
        }})

        const nw = new Memory();
        const nb = new Memory();

        gradw.pipe(inc()).pipe(new Transposer()).pipe(nw.inline);
        this.weights = nw.outline;

        gradb.pipe(inc()).pipe(nb.inline);       
        this.biases = nb.outline;

        return grada;
    }
}

export function dense(op:dense_options) {
    return new Dense(op);
}