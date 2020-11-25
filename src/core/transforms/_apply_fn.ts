import { Transform, TransformCallback, TransformOptions } from "stream";
import { _details } from "../vertex";

export class _apply_fn extends Transform{

    constructor(
        options:TransformOptions, 
        private details:_details, private fn:(n:any)=>{}
    ){
        super(options);        
    }

    _transform(c:any, en:BufferEncoding, next:TransformCallback){        
        this.push([c[0],  this.fn(c[1]), this.details.id, c[3]]);                    
        next();       
    }
}
