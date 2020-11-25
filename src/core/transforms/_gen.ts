import { Readable, ReadableOptions, Transform, TransformCallback, TransformOptions} from "stream"
import { _details } from "../vertex";

export class _gen_random extends Transform{
    private i = 0;

    constructor(options:TransformOptions, private total:number, private details:_details, private it:number){
        super(options);        
    }

    _read(){
        if(this.i < this.total){
            this.push([this.i, Math.random(), this.details.id, this.it]);
            this.i += 1;
        }else{
            this.push(null);
        }
    }
}