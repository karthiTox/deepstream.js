import { Readable, Transform, TransformCallback } from "stream";
import { data } from "./data.interface";

export class Switcher extends Transform{
    constructor(
        private FirstStream:Readable|Transform, 
        private fid:number, 
        private SecondStream:Readable|Transform, 
        private sid:number){
        super({objectMode:true, highWaterMark:1});        
    }

    _transform(data:data, en:BufferEncoding, next:TransformCallback){
        if(data.id == this.fid){
            this.FirstStream.pause();
            this.SecondStream.resume();
        }else if(data.id == this.sid){            
            this.SecondStream.pause();
            this.FirstStream.resume();
        }else{
            this.FirstStream.resume();
            this.SecondStream.resume();
        }
        this.push(data);
        next()
    }

}

export function switcher(a:Readable|Transform, aid:number, b:Readable|Transform, bid:number){
    const switcher = new Switcher(a, aid, b, bid);
    a.pipe(switcher, {end:false});
    b.pipe(switcher, {end:false});

    return switcher;
}