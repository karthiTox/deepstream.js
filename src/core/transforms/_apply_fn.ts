import { Readable, Transform, TransformCallback, TransformOptions } from "stream";
import { data } from "./data.interface";

export class Applyfn extends Transform{

    constructor(
         private fn:(n:any)=>{}
    ){
        super({objectMode:true, highWaterMark:1});        
    }

    _transform(data:data, en:BufferEncoding, next:TransformCallback){        
        data.value = this.fn(data.value) as number;    
        this.push(data);                    
        next();       
    }
}

export function applyfn(a:Readable|Transform, fn:(n:any)=>{}){
    const applyfn = new Applyfn(fn);
    a.pipe(applyfn);
    return applyfn;
}