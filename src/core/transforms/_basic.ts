import { Readable, Transform, TransformCallback } from "stream"
import { data } from "./data.interface";
import { switcher, Switcher } from "./_switcher";

export class Adder extends Transform{
    private waitings:{
        [index:string]: number
    } = {};

    constructor(){
        super({objectMode:true, highWaterMark:1});
    }

    _transform(data:data, en:BufferEncoding, next:TransformCallback){
        const index = JSON.stringify(data.index)+JSON.stringify(data.iteration);

        if(index in this.waitings){
            const res = this.waitings[index] + data.value;
            data.value = res;
            this.push(data);
            delete this.waitings[index];
        }else{
    
            this.waitings[index] = data.value;
        }
        
        next();        
    }
}

export function add(a:Readable|Transform, aid:number, b:Readable|Transform, bid:number){
    const adder = new Adder();
    const switched = switcher(a, aid, b, bid);
    switched.pipe(adder);
    
    return adder
}
