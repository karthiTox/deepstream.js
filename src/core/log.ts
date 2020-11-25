import { createWriteStream } from "fs";
import { join } from "path";
import { Writable } from "stream";

export function logger(msg:string){
    const message = msg;
    return new Writable({
        objectMode:true, 
        write(data:any, en:BufferEncoding, next:any){
            console.log(message, data);
            next()
    }})
}

export const dataWriter = new class{
    private file = createWriteStream(join(__dirname, "/log.txt"));
    write(s:string){
        this.file.write(s+"\n")
    }
};