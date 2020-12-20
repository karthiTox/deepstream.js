import { count } from "console";
import { EventEmitter } from "events";
import { Readable, Stream, Transform, TransformCallback, TransformOptions} from "stream"
import { data } from "./data.interface";

export class Changer extends Transform{
    constructor(private key:keyof(data), private val:any){
        super({objectMode:true, highWaterMark:1});               
    }

    _transform(data:data, e:BufferEncoding, next:TransformCallback){ 
        data = JSON.parse(JSON.stringify(data))       
        data[this.key] = this.val;
        this.push(JSON.parse(JSON.stringify(data)));
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
        data = JSON.parse(JSON.stringify(data))
        data.value *= this.val;
        this.push(JSON.parse(JSON.stringify(data)));
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


export class LineStringify extends Transform{
    constructor(){
        super({
            writableObjectMode:true, writableHighWaterMark:1,
            readableHighWaterMark:100, 
        });               
    }

    _transform(data:any, e:BufferEncoding, next:TransformCallback){        
        data = JSON.stringify(data) + "\n";
        this.push(data);
        next();
    }
}


export class LineParser extends Transform{
    private remaining = '';
    constructor(){
        super({
            readableObjectMode:true, readableHighWaterMark:1,
            writableHighWaterMark:10,
        });             
    }

    _transform(data:any, e:BufferEncoding, next:TransformCallback){        
        this.remaining += data.toString();
        let nindex = this.remaining.indexOf("\n");
        while(nindex != -1){
            let value = this.remaining.substring(0, nindex);
            this.remaining = this.remaining.substring(nindex+1);                             
            this.push(JSON.parse(value));
            nindex = this.remaining.indexOf("\n");
        }
        next();
    }
}



export class IterationCounter extends Transform{
    constructor(){
        super({objectMode:true, highWaterMark:1}); 
        
        // setInterval(() => {
        //     this.counter_emitter.emit("finished")
        // }, 10000);
    }

    public counter_emitter = new EventEmitter()
    public counts:{
        [key:number]:number
    } = {}

    public in:{[key:number]:boolean} = {}

    _transform(data:data, e:BufferEncoding, next:TransformCallback){        
        if(!(data.iteration in this.counts)){
            this.counts[data.iteration] = 1;
        }else{
            this.counts[data.iteration] += 1;
        }

        this.in[data.index] = true;

        if(this.counts[data.iteration] >= data.shape.reduce((a,b)=>a*b)){
            this.counter_emitter.emit("finished");
            delete this.counts[data.iteration];

        }            

        this.push(data);
        next();
    }
}


