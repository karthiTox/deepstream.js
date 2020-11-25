import { Transform, TransformCallback, TransformOptions } from "stream";
import { genId, vertex, _details } from "./vertex";
import { _multiply } from "./transforms/_basic";
import { _memory } from "./transforms/_memory";
import { dataWriter } from "./log";
import { _apply_fn } from "./transforms/_apply_fn";

export function apply_act(
    a:vertex,
    _fn:(n:any)=>{},
    delta:(n:any)=>{},
    transform_options:TransformOptions = {objectMode:true}
){
    const details =  {id:genId(), shape:a.details.shape, step:a.details.step}

    const afn = new _apply_fn(
        transform_options, 
        details,
        _fn        
    )
    
    const memory = new _memory("[at apply_fn fn]");
    
    a.stream.pipe(memory.get_input_line());
    a.stream.pipe(afn);
    
    const res = new vertex(afn, details, [a]);
    
    res.back = () => {
        const dfn =  new _apply_fn(transform_options, res.parents[0].grad_details, delta);
        const multiplier = new _multiply(transform_options, res.parents[0].grad_details)
        
        memory.get_output_line().pipe(dfn).pipe(multiplier);        
        res.grad.pipe(multiplier);

        multiplier.pipe(res.parents[0].grad);
    }

    return res
}