import { Readable, Stream, Transform, TransformCallback, TransformOptions} from "stream"
import { data } from "./data.interface";
import {_cindex, _cstep, _cstep_change, _findIndex} from "./utils"
import { switcher } from "./_switcher";

export class Transposer extends Transform{
    constructor(){
        super({objectMode:true, highWaterMark:1});               
    }

    _transform(data:data, e:BufferEncoding, next:TransformCallback){  
        data = JSON.parse(JSON.stringify(data))      
        const shape = data.shape;
        const step = _cstep(data.shape);
        const op_shape = JSON.parse(JSON.stringify(data.shape)).reverse();
        
        let index = _findIndex(shape, step, data.index)        
        let res = _cindex( index.reverse(), _cstep(op_shape) );
    
        data.index = res;
        data.shape = op_shape;

        this.push(JSON.parse(JSON.stringify(data)));
        next();
    }
}

export function transpose(a:Readable|Transform){
    const transposer = new Transposer();
    a.pipe(transposer);
    return transposer;
}

export class Mapper extends Transform{
    private i:number|null = null; 
    private j:number|null = null; 
    private k:number|null = null; 

    private waitings:{[id:number]:data[]} = {}
    constructor(
        private fid:number,
        private sid:number
    ){
        super({objectMode:true, highWaterMark:1});
        this.waitings[fid] = [];
        this.waitings[sid] = [];
    }

    _transform(data:data, e:BufferEncoding, next:TransformCallback){ 
        data = JSON.parse(JSON.stringify(data))
        // console.log(data)

        
        // finding i, j, k, output_shape
        if(!this.i || !this.j || !this.k){
            if(data.id == this.fid){
                this.i = data.shape[0];
                this.j = data.shape[1];
            }
            else if(data.id == this.sid){                
                this.k = data.shape[1];
            }
        }
        
        // update waiting
        if(!this.i || !this.j|| !this.k){                        
            this.waitings[data.id].push(data);
            return next();            
        }

        if(this.i && this.j && this.k){
            this.push_results(data);
            
            if(this.waitings[this.fid].length > 0 || this.waitings[this.sid].length > 0){
                this.waitings[this.fid].forEach(d => this.push_results(d))
                this.waitings[this.sid].forEach(d => this.push_results(d))
                this.waitings[this.fid].length = 0;
                this.waitings[this.sid].length = 0;
            }
        }                      
        

        next();
    }

    push_results(data:data){
        if(this.i && this.j && this.k){
            // finding index
            const _shape = data.shape;
            const _step = _cstep(data.shape);
            let index = _findIndex(_shape, _step, data.index);            
    
            // mapping respectively
            const op_shape = [this.i, this.k];
            const op_step = _cstep(op_shape);
            if(data.id == this.fid){
                let i = index[0];
                let j = index[1];
                
                for(let k = 0; k < this.k; k++){
                    const push:any = Object.assign({}, data);
                    push.index = _cindex([i, k], op_step);
                    push.shape = op_shape;
                    push.j = j;                                        
                    push.tot_j = this.j;                                        
                    
                    this.push(JSON.parse(JSON.stringify(push)));            
                }
            }
    
            else if(data.id == this.sid){
                let j = index[0];
                let k = index[1];
    
                for(let i = 0; i < this.i; i++){                
                    const push:any = Object.assign({}, data);
                    push.index = _cindex([i, k], op_step);
                    push.shape = op_shape;
                    push.j = j;                                        
                    push.tot_j = this.j;                                        
                    
                    this.push(JSON.parse(JSON.stringify(push)));          
                }
            }
        }
    }
}


export class Reducer extends Transform{
    private waitings:{
        [index:string]:{
            tot:number;
            count:number;
            values:{
                [j:number]:number
            };
        }
    } = {};
    constructor(        

    ){
        super({objectMode:true, highWaterMark:1});        
    }

    _transform(data:any, e:BufferEncoding, next:TransformCallback){ 
        data = JSON.parse(JSON.stringify(data))
        const index = JSON.stringify(data.iteration) + JSON.stringify(data.index)                           
        
        // initalizing
        if(!(index in this.waitings)){
            this.waitings[index] = { values:{}, count:0, tot:0 }
        }

        const waiting = this.waitings[index];
        
        // reducing
        if(data.j in waiting.values){                
            waiting.tot += waiting.values[data.j] * data.value;
            waiting.count++;                                  
            delete this.waitings[index].values[data.j]
        }else{            
            waiting.values[data.j] = data.value;
        }            

        // push the res to readable stream
        if(waiting.count == data.tot_j){            
            this.push(<data>JSON.parse(JSON.stringify({
                id:0,
                index:data.index, 
                iteration:data.iteration,
                value:waiting.tot, 
                shape:data.shape, 
            })))  
            delete this.waitings[index]                                        
        }         

        next();
    }
}

export function matmul(a:Readable|Transform, aid:number, b:Readable|Transform, bid:number){
    const mapper = new Mapper(aid, bid);
    const reducer = new Reducer();
    const switched = switcher(a, aid, b, bid);
    switched.pipe(mapper).pipe(reducer);
    return reducer;
}