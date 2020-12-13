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

export class Memory{
    public inline = new Writable({objectMode:true, highWaterMark:1});
    public outline = new PassThrough({objectMode:true, highWaterMark:1});
    private bucket = this.create_bucket();

    constructor(private threshold:number = 5){
        if(!fs.existsSync(join(__dirname, "/temp_pool"))){
            fs.mkdirSync(join(__dirname, "/temp_pool"))
        }
        
        this.inline._write = (data:any, en:BufferEncoding, next:TransformCallback)=>{
            const isPushed = this.bucket.push(data);

            if(!isPushed){
                this.bucket.unpipe();
                let name = this.get_name()
                
                let writer = fs.createWriteStream(name, {highWaterMark:10});
                this.bucket.pipe(new LineStringify()).pipe(writer);
                this.bucket.push(null);
                
                writer.on("close", ()=>{
                    let reader = fs.createReadStream(name, {highWaterMark:10});
                    reader.pipe(new LineParser()).pipe(this.outline, {end:false});
                    reader.on("close", ()=>{
                        fs.unlinkSync(name);
                    })
                })

                this.bucket =  this.create_bucket();
            }

            next();
        }
    }

    get_name(){
        return join(__dirname, "/temp_pool/temp"+Math.random()+".txt");
    }

    create_bucket(){
        let bucket = new Readable({objectMode:true, highWaterMark:this.threshold, read(){}});
        bucket.pipe(this.outline, {end:false});
        return bucket;
    }
    
}


export class OneShotMemory{
    private name:string;
    
    public inline:fs.WriteStream;

    constructor(){
        if(!fs.existsSync(join(__dirname, "/temp_pool"))){
            fs.mkdirSync(join(__dirname, "/temp_pool"))
        }

        this.name = this.get_name();
        this.inline = fs.createWriteStream(this.name, {highWaterMark:10}); 
    }

    get_name(){
        return join(__dirname, "/temp_pool/temp"+Math.random()+".txt");
    }

    get_outline(){   
        this.inline.close();

        const parser = new LineParser();
        const reader = fs.createReadStream(this.name, {highWaterMark:10});      
        reader.pipe(parser);  
        reader.on("close", ()=>{
            fs.unlinkSync(this.name)            
        })

        return parser;
    }
}


