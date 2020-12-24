import { Transform, TransformCallback, Writable } from "stream";
import { data } from "./data.interface";


export function formatMemory(data:number){    
    return Math.round((data / 1024 / 1024)*100)/100;
}

export function AllowOnly(key:keyof(data), divisible:number){
    if(key == "shape"){
        throw new Error("shape is not an number");
    }

    return new Transform({
        objectMode:true, 
        highWaterMark:1,
        transform(data:data, en, next){
            if(data[key]%divisible == 0) this.push(data);
            next();
        }
    })
}


export function log(log:boolean = true, stringify:boolean = false, key?:keyof(data)){
    return new Writable({
        objectMode:true, 
        highWaterMark:1,
        write(data:any, en:BufferEncoding, next:any){
            if(log) 
                if(stringify)    
                    console.log(JSON.stringify(key?data[key]:data));
                else
                    console.log(key?data[key]:data);
            
            next()
    }})
}

export function logfn(fn = (data:data)=>{}){
    return new Writable({
        objectMode:true, 
        highWaterMark:1,
        write(data:any, en:BufferEncoding, next:any){
            if(fn) 
                fn(data);
            next();
    }})
}


export function logDetail(){
    return new class log_detail extends Writable{
        public counts:{
            [key:number]:number
        } = {};

        public max_memory:number|null = null;
        public min_memory:number|null = null;

        constructor(){
            super({objectMode:true, highWaterMark:1});            
        }        

        _write(data:data, en:BufferEncoding, next:TransformCallback){            
            if(!(data.iteration in this.counts))
                this.counts[data.iteration] = 1;
            else
                this.counts[data.iteration] += 1;

            let memory_used = formatMemory(process.memoryUsage().heapUsed);

            if(!this.max_memory) this.max_memory = memory_used;
            if(!this.min_memory) this.min_memory = memory_used;
            
            if(this.max_memory)
                if(this.max_memory < memory_used) this.max_memory = memory_used;            
            if(this.min_memory)
                if(this.min_memory > memory_used) this.min_memory = memory_used;            

            let tot = data.shape.reduce((a,b)=>a*b);
            if(this.counts[data.iteration] >= tot){                            
                console.log("--------------------------");
                console.log("Memory usage:\nMax:" + this.max_memory);
                console.log("Min:" + this.min_memory);
                console.log("total output recived at iteration "+data.iteration+": " + this.counts[data.iteration] + "/" + tot);                
                delete this.counts[data.iteration];
            }    

            next();
        }
    }
}
