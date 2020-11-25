import { genId, vertex } from "./vertex";
import * as basic_ops from "./transforms/_basic";
import { _memory } from "./transforms/_memory";
import { TransformOptions } from "stream";

export function add(
    a:vertex,
    b:vertex,
    transform_options:TransformOptions = {objectMode:true}
):vertex{
    const details = {        
        id:genId(),
        shape: a.details.shape,
        step: a.details.step
    }

    const adder = new basic_ops._add(transform_options, details);
    a.stream.pipe(adder);
    b.stream.pipe(adder);
    
    const res = new vertex(adder, details, [a, b]);

    res.back = () => {
        res.parents.forEach((parent, i) => {
            const change = new basic_ops._change_val(
                transform_options, 
                2, 
                i == 0 ? a.grad_details.id : b.grad_details.id
            );
            res.grad.pipe(change);

            change.pipe(parent.grad);
        })
    }

    return res;
}


export function multiply(
    a:vertex,
    b:vertex,
):vertex{
    const details = {        
        id:genId(),
        shape: a.details.shape,
        step: a.details.step
    }

    const a_stream_memory = new _memory("[at multily fn for a]");
    const b_stream_memory = new _memory("[at multily fn for b]");
    const multiplier = new basic_ops._multiply({objectMode:true}, details);
    
    a.stream.pipe(multiplier);
    a.stream.pipe(a_stream_memory.get_input_line());

    b.stream.pipe(multiplier);
    b.stream.pipe(b_stream_memory.get_input_line());

    const res = new vertex(multiplier, details, [a, b]);

    res.back = () => {
        res.parents.forEach((parent, i) => {
            const multiplier =  new basic_ops._multiply(
                {objectMode:true}, 
                parent.grad_details,
            )

            if(i == 0) // if a
                b_stream_memory.get_output_line().pipe(multiplier);
            else if(i == 1)// if b
                a_stream_memory.get_output_line().pipe(multiplier);            
            
            res.grad.pipe(multiplier);
            multiplier.pipe(parent.grad);

        })
    }

    return res;
}


export function sub(
    a:vertex,
    b:vertex,
):vertex{
    const details = {        
        id:genId(),
        shape: a.details.shape,
        step: a.details.step
    }

    const subtractor = new basic_ops._multiply({objectMode:true}, details);
    
    a.stream.pipe(subtractor);

    b.stream.pipe(subtractor);
    
    const res = new vertex(subtractor, details,[a, b]);

    res.back = () => {
        res.parents.forEach((parent, i) => {
            // if a
            if(i == 0) 
                res.grad.pipe(parent.grad);
            // if b
            else if(i == 1)
                res.grad.pipe(
                    new basic_ops._mul_with
                    (
                        {objectMode:true}, 
                        {id:genId(), shape:details.shape, step:details.step}                        ,
                        -1
                    )
                ).pipe(parent.grad);
        })
    }

    return res;
}