import { createWriteStream } from "fs";
import { join } from "path";
import { Transform, Writable } from "stream";
import { data } from "./data.interface";

export function create_writer(name:string){
    return createWriteStream(join(__dirname, "/"+name+".csv"))
}

export function formatMemory(data:number){    
    return Math.round((data / 1024 / 1024)*100)/100;
}

const writter = create_writer("new_light")

export function logger(msg:string, log:boolean = true, logAt?:number){
    const message = msg;
    return new Writable({
        objectMode:true, 
        highWaterMark:1,
        write(data:any, en:BufferEncoding, next:any){
            if(log){
                if(logAt){
                    if(data.iteration%logAt == 0){
                        writter.write(data.index +","+ formatMemory(process.memoryUsage().heapUsed) + ",\n")                    
                        console.log(formatMemory(process.memoryUsage().heapUsed));  
                        console.log(message, JSON.stringify(data))
                    }                  
                }
                else{
                    writter.write(data.index +","+ formatMemory(process.memoryUsage().heapUsed) + ",\n")
                    // writter.write(formatMemory(process.memoryUsage().heapUsed) + ",\n")
                    
                    console.log(formatMemory(process.memoryUsage().heapUsed));  
                    console.log(message, JSON.stringify(data))  
                }  
            }
            next()
    }})
}


export function AllowAt(key:keyof(data), logAt:number){
    return new Transform({
        objectMode:true, 
        highWaterMark:1,
        transform(data:data, en, next){
            if(data["index"]%logAt == 0)
                this.push(data)
            next()
        }
    })
}

export const dataWriter = new class{
    private file = createWriteStream(join(__dirname, "/log.txt"));
    write(s:string){
        this.file.write(s+"\n")
    }
};