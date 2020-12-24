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
import { _cstep, _findIndex, _cindex } from "./utils";
import { EventEmitter } from "events";

function get_name(){
    return join(__dirname, "/temp_pool/temp"+Math.random()+".txt");
}

export class Memory{
    public inline = new Writable({objectMode:true, highWaterMark:1});
    public outline = new PassThrough({objectMode:true, highWaterMark:1});
    private bucket = this.create_bucket();

    private finished:string[] = [] 
    private connected = false;

    constructor(private threshold:number = 100){
        if(!fs.existsSync(join(__dirname, "/temp_pool"))){
            fs.mkdirSync(join(__dirname, "/temp_pool"))
        }
        
        this.inline._write = (data:any, en:BufferEncoding, next:TransformCallback)=>{
            const isPushed = this.bucket.push(data);

            if(!isPushed){
                this.bucket.unpipe();
                let name = get_name()
                
                let writer = fs.createWriteStream(name, {highWaterMark:10});
                this.bucket.pipe(new LineStringify()).pipe(writer);
                this.bucket.push(null);
                
                writer.once("finish", ()=>{                    
                    this.finished.push(name);
                    this.connect();
                })

                this.bucket =  this.create_bucket();
            }

            next();
        }
    }

    connect(){
        if(!this.connected){
            const name = this.finished.shift();
            if(name){
                let reader = fs.createReadStream(name, {highWaterMark:10});
                let lineParser = new LineParser();              
                reader.pipe(lineParser).pipe(this.outline, {end:false});
                this.connected = true
                reader.once("end", ()=>{  
                    reader.unpipe();
                    lineParser.unpipe();
                    reader.destroy();
                    lineParser.destroy();

                    this.connected = false;                    
                    fs.unlink(name, (err)=>{
                        if(err) throw err;
                    });
                    this.connect()
                })
            }
        }
    }   

    create_bucket(){
        let bucket = new Readable({objectMode:true, highWaterMark:this.threshold, read(){}});
        bucket.pipe(this.outline, {end:false});
        return bucket;
    }
    
}


export class OneShotMemory{
    public inline = new PassThrough({objectMode:true, highWaterMark:1});
    public outline = new PassThrough({objectMode:true, highWaterMark:1});

    constructor(){
        if(!fs.existsSync(join(__dirname, "/temp_pool"))){
            fs.mkdirSync(join(__dirname, "/temp_pool"))
        }

        let osm_counter = new Counter("osm")
        let wr = this.inline
            .pipe(osm_counter)
            .pipe(new LineStringify())
            .pipe(fs.createWriteStream(get_name(), {highWaterMark:100}));

        osm_counter.once("finished", ()=>{
            osm_counter.end();            
            wr.once("finish", ()=>{
                let reader = fs.createReadStream(wr.path, {highWaterMark:100})
                reader.pipe(new LineParser()).pipe(this.outline);

                reader.once("end", ()=>{
                    fs.unlink(reader.path, (err)=>{
                        if(err) throw err;
                    })
                })
            })
        })
    }
    
}


export class MemoryCollection extends EventEmitter{
    constructor(){
        super({});
        if(!fs.existsSync(join(__dirname, "/temp_pool"))){
            fs.mkdirSync(join(__dirname, "/temp_pool"))
        }
    }

    private memory:{
        [name:string]:{
            inline:PassThrough;
            outline:PassThrough;
            storage:Memory
            finished:boolean;
        }
    } = {}

    add(name:string, Storage:Memory){
        this.memory[name] = {
            inline:new PassThrough({objectMode:true, highWaterMark:1}),
            outline:new PassThrough({objectMode:true, highWaterMark:1}),
            storage:Storage,
            finished:false,
        };   
        
        const counter = new Counter(name);
        this.memory[name].inline.pipe(counter).pipe(Storage.inline);

        counter.on("finished", (d:{name:string, it:number})=>{           
            this.memory[d.name].finished = true;
            this.check();
        })
    }

    check(){
        let finished = false;
        for(const m in this.memory){
            finished = this.memory[m].finished;
        }

        if(!finished){
            for(const m in this.memory){
                this.memory[m].storage.outline.pipe(this.memory[m].outline);
            }

            this.emit("inline-finished")
        }
    }

    get(name:string){
        return this.memory[name];
    }
}

class Counter extends Transform{
    constructor(private name:string){
        super({objectMode:true, highWaterMark:1});
    }

    public counts:{
        [key:number]:number
    } = {}

    public in:{[key:number]:boolean} = {}

    _transform(data:data, e:BufferEncoding, next:TransformCallback){        
        if(!(data.iteration in this.counts)){
            this.counts[data.iteration] = 1;
        }else{
            this.counts[data.iteration] += 1;
        }

        this.in[data.index] = true;

        if(this.counts[data.iteration] >= data.shape.reduce((a,b)=>a*b)){
            this.emit("finished", {name:this.name, it:data.iteration});
            delete this.counts[data.iteration];

        }            

        this.push(data);
        next();
    }
}


