import { Readable, Stream, Transform, TransformCallback, TransformOptions} from "stream"
import { data } from "./data.interface";
import { dataWriter } from "./log";
import {_cindex, _cstep, _cstep_change, _findIndex} from "./utils"

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
    private i:number|null = null; 
    private i:number|null = null; 
    private i:number|null = null; 

    constructor(
        private fid:number,
        private sid:number
    ){
        super({objectMode:true, highWaterMark:1});
    }

    _transform(data:data, e:BufferEncoding, next:TransformCallback){                        
        // finding index
        const _shape = data.shape;
        const _step = _cstep(data.shape);
        let index = _findIndex(_shape, _step, data.index);            

        // mapping respectively
        if(data.id == this.fid){
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

        else if(data.id == this.sid){
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
