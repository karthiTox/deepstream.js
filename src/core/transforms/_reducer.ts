import { Readable, Transform, TransformCallback } from "stream"
import { data } from "./data.interface";

export class Reducer extends Transform{
    constructor(private fn = (a:number, b:number)=>{return a+b}, private avg:boolean){
        super({objectMode:true, highWaterMark:1});      
    }

    private waitings:{
        [iteration:number]:{
            tot:data;
            count:number;
        }
    } = {}

    _transform(data:data, en:BufferEncoding, next:TransformCallback){
        data = JSON.parse(JSON.stringify(data));
        
        if(!(data.iteration in this.waitings)){
            this.waitings[data.iteration] = {
                tot:{
                    id:0,
                    index:0,
                    iteration:data.iteration,
                    value:data.value,
                    shape:[1, 1],
                },
                count:1
            }
        }else{
            this.waitings[data.iteration].tot.value = this.fn(this.waitings[data.iteration].tot.value, data.value);
            this.waitings[data.iteration].count += 1;
        }

        if(this.waitings[data.iteration].count >= data.shape.reduce((a,b)=>a*b)){                             
            if(this.avg) this.waitings[data.iteration].tot.value /= this.waitings[data.iteration].count;

            this.push(JSON.parse(JSON.stringify(this.waitings[data.iteration].tot)));
            delete this.waitings[data.iteration];
        }

        next();
    }
}

export function reduce(a:Readable|Transform, fn = (a:number, b:number)=>{return a+b}, avg:boolean=false) {
    return a.pipe(new Reducer(fn, avg));
}