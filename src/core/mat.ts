import { logger } from "./log";
import { genId, _details, vertex } from "./vertex";
import { _mapper, _reducer, _mapper_options, _reducer_options, _transpose, _transpose_options, _cstep_change, _cstep } from "./transforms/_mat";
import { _memory } from "./transforms/_memory";
import { TransformOptions } from "stream";

export function transpose(
    a:vertex,    
    Transorm_options:TransformOptions = {objectMode:true},
    dim:number[] = a.details.step.map((v, i) => i).reverse()
){
    const details:_details = {
        id:genId(),
        shape: _cstep_change(a.details.shape, dim),
        step:_cstep(_cstep_change(a.details.shape, dim)),
    }

    const transposer = new _transpose({
        output_id: details.id,
        shape:a.details.shape,
        step:a.details.step,
        _step: details.step,
    }, Transorm_options)

    a.stream.pipe(transposer);

    const res = new vertex(transposer, details, [a]);
    res.back = ()=>{
        const transposer = new _transpose({
            output_id: res.parents[0].grad_details.id,
            shape: res.grad_details.shape,
            step:  res.grad_details.step,
            _step: _cstep(_cstep_change(res.grad_details.shape, dim)),
        }, Transorm_options)
        
        res.grad.pipe(transposer).pipe(res.parents[0].grad);
    }

    return res
}

function gen_mapper_options(details:_details, a_details:_details, b_details:_details){
    const mapper_op:_mapper_options = {
        i:a_details.shape[0],
        j:a_details.shape[1],
        k:b_details.shape[1],
        inputs:{
            [a_details.id]:{
                place:0,
                shape:a_details.shape,
                step:a_details.step
            },
            [b_details.id]:{
                place:1,
                shape:b_details.shape,
                step:b_details.step
            }
        },
        output:{
            shape:details.shape,
            step:details.step,
        },
    }

    return mapper_op;
}

function gen_reducer_options(details:_details, a_details:_details, b_details:_details){
    return {
        output_id:details.id,
        i:a_details.shape[0],
        j:a_details.shape[1],
        k:b_details.shape[1],
    }
}

export function matmul2d(
    a:vertex,
    b:vertex, 
    Transorm_options:TransformOptions = {objectMode:true}   
){
    const details:_details = {
        id:genId(),
        shape:[a.details.shape[0], b.details.shape[1]],
        step:_cstep([a.details.shape[0], b.details.shape[1]]),
    }

    const mapper_op:_mapper_options = gen_mapper_options(details, a.details, b.details);
    const reducer_options:_reducer_options = gen_reducer_options(details, a.details, b.details);

    const a_stream_memory = new _memory("[at matmul fn for a]");
    const b_stream_memory = new _memory("[at matmul fn for b]");

    const mat_multiplier = new _mapper(mapper_op, Transorm_options);
    const res_stream = mat_multiplier.pipe(new _reducer(reducer_options, Transorm_options));

    a.stream.pipe(a_stream_memory.get_input_line());
    a.stream.pipe(mat_multiplier);

    b.stream.pipe(b_stream_memory.get_input_line());
    b.stream.pipe(mat_multiplier);
    
    const res = new vertex(res_stream, details, [a, b]);

    res.back = ()=>{
        res.parents.forEach((parent, i) => {            
            let details_ = i == 0 ? b.details : a.details
            
            const id = genId();      
            const dim = details_.step.map((v, i) => i).reverse()          
            const _shape = _cstep_change(details_.shape, dim);
            const _step = _cstep(_shape);             

            const transposer = new _transpose({
                output_id: id,
                shape: details_.shape,
                step: details_.step,
                _step: _step,
            }, Transorm_options)
                                   
            // for a
            let res_ = a.grad_details;                                
            let a_ = res.grad_details;                                
            let b_ = {id:id, shape:_shape, step:_step}; 
            
            // for b
            if(i == 1){                
                res_ = b.grad_details;
                a_ = {id:id, shape:_shape, step:_step};
                b_ = res.grad_details;
            }
            
            const mapper =  new _mapper(gen_mapper_options(res_, a_, b_), Transorm_options)
            const reducer = mapper.pipe( new _reducer(gen_reducer_options(res_, a_, b_), Transorm_options));
                            
            res.grad.pipe(mapper);               
            const stream_memory = i == 0 ? b_stream_memory : a_stream_memory
            
            stream_memory.get_output_line().pipe(transposer)            
            transposer.pipe(mapper);
                        
            reducer.pipe(parent.grad);                                      
        })
    }

    return res;
}
