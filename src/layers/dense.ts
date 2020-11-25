import { apply_act } from "../core/apply_act";
import * as act from "../core/activations";
import { genRan } from "../core/gen";
import { add } from "../core/basic";
import { matmul2d, transpose } from "../core/mat";
import { vertex } from "../core/vertex";
import { TransformOptions } from "stream";

class _dense{
    public weight;
    public biases;

    constructor(prev_neurons:number, neurons:number, private transform_options:TransformOptions){
        this.weight = genRan([neurons, prev_neurons], 0.04, this.transform_options);
        this.biases = genRan([1, neurons], 0.04, this.transform_options);
    }    
        
    feed(input_stream:vertex){
        return apply_act(
            add(
                matmul2d(input_stream, transpose(this.weight, this.transform_options), this.transform_options),
                this.biases,                
                this.transform_options
            ),
            act.sig,
            act.sigPrime,            
            this.transform_options
        )
    }    
}

export function dense(prev_neurons:number, neurons:number, transform_options:TransformOptions){
    return new _dense(prev_neurons, neurons, transform_options)
}