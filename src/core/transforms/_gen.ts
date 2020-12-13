import { Readable, ReadableOptions, Transform, TransformCallback, TransformOptions} from "stream"

export class GenRandom extends Readable{
    private i = 0;
    private total = 0;

    constructor(private shape:number[], private id?:number){
        super({objectMode:true, highWaterMark:1}); 
        this.total = shape.reduce((a,b)=>a*b);       
    }

    _read(){
        if(this.i < this.total){
            this.push({
                id:this.id?this.id:0,
                index:this.i,
                iteration:0,
                value:Math.random(),
                shape:this.shape,
            });

            this.i += 1;
        }else{
            this.push(null);
        }
    }
}

export function genRan(shape:number[], id?:number){
    return new GenRandom(shape, id);
}


export class GenVals extends Readable{
    private i = 0;
    private total = 0;
    
    private it = 0;
    private iteration = 0;
               
    constructor(private value:any[], private shape:number[], iteration?:number, private id?:number){
        super({objectMode:true, highWaterMark:1}); 
        this.total = shape.reduce((a,b)=>a*b);
        this.iteration = iteration ? iteration : this.iteration;  
                
    }

    _read(){
        if(this.it < this.iteration){
            this.push({
                id:this.id?this.id:0,
                index:this.i,
                iteration:this.it,
                value:this.value[this.i%this.value.length],
                shape:this.shape,
            });

            if(this.i < this.total-1)
                this.i += 1;
            else{
                this.i = 0;
                this.it += 1;
            }
        }else{
            this.push(null);
        }
    }
}

export function genVals(value:number[], shape:number[], iteration:number = 1, id?:number){
    return new GenVals(value, shape, iteration, id);
}