import { Readable, Stream, Transform, TransformCallback, TransformOptions} from "stream"
import { dataWriter } from "../log";

export function _cstep(shape:number[]):number[]{   
    const res = [];
    for(let s = shape.length; s > 0; s--){
        if(!shape[s]) 
            res.unshift(1);
        else
            res.unshift(
                shape.slice(s).reduce((a, b) => a * b)
            );        
    }
    return res;    
}

export function _cstep_change(step:number[], dimension:number[]):number[]{    
    const res = [];
    for(let d = 0; d < dimension.length; d++){
        res[d] = step[dimension[d]]
    }
    return res;
}

export function _cindex(index:number[], step:number[]):number{
    let res = 0; 
    for(let i = 0; i < index.length; i++){        
        res += index[i] * step[i];
    }
    return res;
}

export function _findIndex(shape:number[], step:number[], index:number):number[]{    
    const _s = [];
    for(let s = 0; s < shape.length; s++){
        _s[s] = shape[s] * step[s]; 
        _s[s] = Math.floor((index%_s[s]) / step[s]);
    }
    
    return _s;
}

export interface _transpose_options{
    shape:number[],
    step:number[],
    _step:number[],
    output_id:number,
}

export class _transpose extends Transform{
    constructor(
        private transpose_options:_transpose_options,         
        Transform_options:TransformOptions
    ){
        super(Transform_options);               
    }

    _transform(data:any, e:BufferEncoding, next:TransformCallback){        
        const shape = this.transpose_options.shape;
        const step = this.transpose_options.step;
        
        let index = _findIndex(shape, step, data[0])        
        let res = _cindex(index.reverse(), this.transpose_options._step);
    
        this.push([res, data[1], this.transpose_options.output_id, data[3]]);
        next();
    }
}


interface _inputs{
    [input_id:number]:{
        place:number;
        shape:number[];
        step:number[];
    }
}

interface _output{   
    shape:number[];
    step:number[];
}

export interface _mapper_options{
    i:number, 
    j:number, 
    k:number, 
    inputs:_inputs,
    output:_output,
}

export class _mapper extends Transform{
    constructor(
        private mapper_options:_mapper_options,
        tansform_options:TransformOptions
    ){
        super(tansform_options);
    }

    _transform(c:any, e:BufferEncoding, next:TransformCallback){                        
        // finding index
        const _shape = this.mapper_options.inputs[c[2]].shape;
        const _step = this.mapper_options.inputs[c[2]].step;
        let index = _findIndex(_shape, _step, c[0]);            

        // mapping respectively
        if(this.mapper_options.inputs[c[2]].place == 0){
            let i = index[0];
            let j = index[1];
            
            for(let k = 0; k < this.mapper_options.k; k++){
                this.push(
                    [
                        c[3], _cindex([i, k], this.mapper_options.output.step),                        
                        c[1], j
                    ]
                )            
            }
        }

        else if(this.mapper_options.inputs[c[2]].place == 1){
            let j = index[0];
            let k = index[1];

            for(let i = 0; i < this.mapper_options.i; i++){                
                this.push(
                    [
                        c[3], _cindex([i, k], this.mapper_options.output.step),                                                 
                        c[1], j
                    ]
                )            
            }
        }

        next();
    }
}



interface _waitings {
    [index:string]:{
        tot:number;
        count:number;
        values:{
            [j:number]:number[]
        };
    }
}

export interface _reducer_options{
    i:number;
    j:number; 
    k:number;
    output_id:number;
}

export class _reducer extends Transform{
    private waitings:_waitings = {};
    constructor(        
        private reducer_options:_reducer_options, 
        tansform_options:TransformOptions){
        super(tansform_options);        
    }

    _transform(data:any, e:BufferEncoding, next:TransformCallback){ 
        const index = JSON.stringify(data[1]) + JSON.stringify(data[0])                           
        
        // initalizing
        if(!(index in this.waitings)){
            this.waitings[index] = { values:{}, count:0, tot:0 }
        }

        const waiting = this.waitings[index];
        
        // reducing
        if(data[3] in waiting.values){                
            waiting.tot += waiting.values[data[3]][2] * data[2];
            waiting.count++;                                  
            delete this.waitings[index].values[data[3]]
        }else{            
            waiting.values[data[3]] = data;
        }            

        // push the res to readable stream
        if(waiting.count == this.reducer_options.j){            
            this.push([data[1], waiting.tot, this.reducer_options.output_id, data[0]])  
            delete this.waitings[index]                                        
        }         

        next()
    }
}
