import { Readable, Stream, Transform, TransformCallback, TransformOptions} from "stream"
import { dataWriter } from "../log";
import { _details } from "../vertex"

interface _waitings{
    [index:string]: number
}

export class _add extends Transform{
    private waitings:_waitings = {};

    constructor(options:TransformOptions, private details:_details){
        super(options);
    }

    _transform(data:number[], en:BufferEncoding, next:TransformCallback){
        const index = JSON.stringify(data[0])+JSON.stringify(data[3])

        if(index in this.waitings){
            const res = this.waitings[index] + data[1];
            this.push([ data[0], res,  this.details.id, data[3]]);
            delete this.waitings[index];
        }else{
    
            this.waitings[index] = data[1];
        }
        
        next();        
    }
}

export class _sub extends Transform{
    private waitings:_waitings = {};

    constructor(options:TransformOptions, private details:_details){
        super(options);
    }

    _transform(data:number[], en:BufferEncoding, next:TransformCallback){
        const index = JSON.stringify(data[0])+JSON.stringify(data[3])

        if(index in this.waitings){
            const res = this.waitings[index] - data[1];
            this.push([ data[0], res,  this.details.id, data[3]]);
            delete this.waitings[index];
        }else{
    
            this.waitings[index] = data[1];
        }
        
        next();        
    }
}

export class _multiply extends Transform{
    private waitings:_waitings = {};

    constructor(options:TransformOptions, private details:_details){
        super(options);
    }

    _transform(data:number[], en:BufferEncoding, next:TransformCallback){
        const index = JSON.stringify(data[0])+JSON.stringify(data[3])

        if(index in this.waitings){
            const res = this.waitings[index] * data[1];
            this.push([ data[0], res,  this.details.id, data[3]]);
            delete this.waitings[index];
        }else{
    
            this.waitings[index] = data[1];
        }
        
        next();        
    }
}


export class _mul_with extends Transform{

    constructor(options:TransformOptions, private details:_details, private val:number){
        super(options);
    }

    _transform(c:any, en:BufferEncoding, next:TransformCallback){
        this.push([c[0],  c[1] * this.val, this.details.id, c[3] ]);                    
        next();       
    }
}



export class _change_val extends Transform{

    constructor(options:TransformOptions, private index:number, private val:number){
        super(options);
    }

    _transform(c:any, en:BufferEncoding, next:TransformCallback){
        c[this.index] = this.val
        this.push(c);                    
        next();       
    }
}

