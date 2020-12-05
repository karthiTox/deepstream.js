import { Readable, Transform, TransformCallback } from "stream"
import { data } from "./data.interface";
import { switcher, Switcher } from "./_switcher";
import { mulwith } from "./_transform_utils";

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


export function sub(a:Readable|Transform, aid:number, b:Readable|Transform, bid:number){
    return add(a, aid, mulwith(b, -1), bid);
}

export class Multiplier extends Transform{
    private waitings:{
        [index:string]: number
    } = {};

    constructor(){
        super({objectMode:true, highWaterMark:1});
    }

    _transform(data:data, en:BufferEncoding, next:TransformCallback){
        const index = JSON.stringify(data.index)+JSON.stringify(data.iteration);

        if(index in this.waitings){
            const res = this.waitings[index] * data.value;
            data.value = res;
            this.push(data);
            delete this.waitings[index];
        }else{
    
            this.waitings[index] = data.value;
        }
        
        next();        
    }
}

export function multiply(a:Readable|Transform, aid:number, b:Readable|Transform, bid:number){
    const multiplier = new Multiplier();
    const switched = switcher(a, aid, b, bid);
    switched.pipe(multiplier);
    return multiplier
}