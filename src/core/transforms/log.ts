import { createWriteStream } from "fs";
import { join } from "path";
import { Writable } from "stream";

export function logger(msg:string, log:boolean = true, logAt?:number){
    const message = msg;
    return new Writable({
        objectMode:true, 
        write(data:any, en:BufferEncoding, next:any){
            if(log){
                if(logAt){
                    if(data.index%logAt == 0)
                        console.log(message, data.index);
                }
                else
                    console.log(message, data.index);
            }
            next()
    }})
}

export const dataWriter = new class{
    private file = createWriteStream(join(__dirname, "/log.txt"));
    write(s:string){
        this.file.write(s+"\n")
    }
};