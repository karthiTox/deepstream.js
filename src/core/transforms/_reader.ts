import { createReadStream, fstat } from "fs";
import { Transform, TransformCallback, TransformOptions} from "stream";
import { data } from "./data.interface";

export class Reader extends Transform{
    private i = 0;
    private it = 0;
    private tot = 0;
    private remaining = '';

    constructor(
        private shape:number[],
        private iteration?:number,
    ){
        super({readableObjectMode:true, readableHighWaterMark:1});  
        this.tot = shape.reduce((a,b)=>a*b);
    }

    _transform(text:string, en:BufferEncoding, next:TransformCallback){
        const str = text.toString();
        for (let s = 0; s < str.length; s++) {
            if(!isNaN(Number.parseFloat(str[s])) || str[s] == "," || str[s] == ".")
                this.remaining += str[s];
            if(str[s] == "]")
                this.remaining += ","
        }

        let cindex = this.remaining.indexOf(",");
        while(cindex != -1){
            let value = this.remaining.substring(0, cindex);
            this.remaining = this.remaining.substring(cindex+1);     
            this.push_item(value);
            cindex = this.remaining.indexOf(",");
        }
        next();
    }

    push_item(value:string){
        const num = Number.parseFloat(value);

        this.push(<data>{
            id:0,
            index:this.i,
            iteration:this.iteration ? this.iteration : this.it,
            value:num,
            shape:this.shape,
        })

        if(this.i < this.tot-1)
            this.i += 1;
        else{
            this.i = 0;
            this.it += 1;
        }
    }
}

export function reader(path:string, shape:number[], iteration?:number){
    const read = new Reader(shape, iteration);
    createReadStream(path).pipe(read);
    return read;
}