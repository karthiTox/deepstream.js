import { Readable, Stream, Transform, TransformCallback, TransformOptions} from "stream"
import { data } from "./data.interface";

export class Changer extends Transform{
    constructor(private key:keyof(data), private val:any){
        super({objectMode:true, highWaterMark:1});               
    }

    _transform(data:data, e:BufferEncoding, next:TransformCallback){        
        data[this.key] = this.val;
        this.push(data);
        next();
    }
}

export function changeId(a:Readable|Transform, id:number){
    const changer = new Changer("id", id);
    a.pipe(changer);
    return changer;
}



export class Mulwith extends Transform{
    constructor(private val:number){
        super({objectMode:true, highWaterMark:1});
    }

    _transform(data:data, en:BufferEncoding, next:TransformCallback){
        data.value *= this.val;
        this.push(data);
        next();        
    }
}

export function mulwith(a:Readable|Transform, val:number){
    const mul = new Mulwith(val);
    a.pipe(mul);
    return mul;
}


export class Increment extends Transform{
    constructor(){
        super({objectMode:true, highWaterMark:1});
    }

    _transform(data:data, en:BufferEncoding, next:TransformCallback){        
        data.iteration += 1;
        this.push(data);
        next();        
    }
}

export function increment(a:Readable|Transform, key:keyof(data)){
    const i = new Increment();
    a.pipe(i);
    return i;
}