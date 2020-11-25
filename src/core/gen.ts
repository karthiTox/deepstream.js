import { createWriteStream } from "fs";
import { Transform, TransformCallback, TransformOptions } from "stream";
import { _mul_with, _sub } from "./transforms/_basic";
import { _gen_random } from "./transforms/_gen";
import { _cstep } from "./transforms/_mat";
import { _memory } from "./transforms/_memory";
import { genId, vertex, _details } from "./vertex";

export function genRan(shape:number[], learningRate:number = 0.04, transform_options:TransformOptions={objectMode:true}){
    const details = {id:genId(), shape:shape, step:_cstep(shape)}
    
    const random_numbers = new _gen_random(
        transform_options,
        shape.reduce((a, b)=>a*b),
        details,
        0
    )
    
    const res_stream = new Transform(transform_options)
    res_stream._transform = (c,e,n) => {
        res_stream.push(c);
        n();
    }

    const memory = new _memory("[at gen_]");
    
    random_numbers.pipe(res_stream)
    res_stream.pipe(memory.get_input_line())

    const res = new vertex(
        res_stream, 
        details
    )

    res.back = () => {
        const subtractor = new _sub(transform_options, details)
        const mul_with = new _mul_with(transform_options, details, learningRate);
        memory.get_output_line().pipe(subtractor);

        res.grad.pipe(mul_with)
        mul_with.pipe(subtractor);
        
        const change = new _inc_val(transform_options, details, 3)
        subtractor.pipe(change);

        change.pipe(res.stream);
    }

    return res
}



export class _inc_val extends Transform{
    
    constructor(options:TransformOptions, private details:_details, private index:number){
        super(options);        
    }

    _transform(c:any, en:BufferEncoding, next:TransformCallback){
        c[this.index] += 1;   
        this.push(c);                    
        next();       
    }
}