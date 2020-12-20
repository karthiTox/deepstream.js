import { 
    Transform, 
    Readable, 
    Writable, 
    TransformCallback,
    PassThrough, 
} from "stream";

import * as fs from "graceful-fs";
import { join } from "path";
import { Changer, LineParser, LineStringify } from "./_transform_utils";
import { data } from "./data.interface";
import { create_writer, formatMemory, logger } from "./log";
import { _cstep, _findIndex, _cindex } from "./utils";


export class Exporter extends PassThrough{
    
    private writers:{
        [key:string]:{
            iteration:number;
            count:number;
            writer:fs.WriteStream;            
        }
    } = {}

    constructor(private name:string, private saveAt_iteration:number = 10, private connectTo:Transform){
        super({objectMode:true, highWaterMark:1})
        if(!fs.existsSync(join(__dirname, "/saves"))){
            fs.mkdirSync(join(__dirname, "/saves"))
        }
        
        this.on("data", (data:data)=>{
            const key = "" + data.iteration;        
            const writer = this.get_writer(key);
            
            const isSuccess = writer.writer.write(JSON.stringify(data) + "\n");
            writer.count+=1;


            if(!isSuccess){
                this.pause();
                writer.writer.once("drain", ()=>{
                    this.resume();
                })
            }

            if(writer.count >= data.shape.reduce((a,b)=>a*b)){
                writer.writer.end();
                writer.writer.once("finish", ()=>{
                    // const reader = fs.createReadStream(writer.writer.path)
                    // reader.pipe(new LineParser()).pipe(this.connectTo, {end:false});
                    // console.log("pipe " + this.name + writer.iteration)
                    // reader.once("close", ()=>{
                    //     if(writer.iteration % saveAt_iteration != 0){
                    //         fs.unlink(reader.path, (err)=>{
                    //             if(err) throw err;
                    //         })
                    //     }
                    // })

                })
            }
        })
    }    

    get_writer(key:string){
        if(!(key in this.writers)){
            this.writers[key] = {
                iteration: Number.parseInt(key),
                count:0,
                writer:fs.createWriteStream(join(__dirname, "/saves/"+this.name+key+".txt"))
            }
        }

        return this.writers[key];
    }
}


export class PushTo extends PassThrough{

    constructor(private pushTo:Transform){    
        super({objectMode:true, highWaterMark:1})

        this.on("data", (data:data)=>{
            const isSuccess = this.pushTo.write(data);
            if(!isSuccess) this.pause();                            
        })

        this.pushTo.on("drain", ()=>{
            this.resume();
        })
    } 
}