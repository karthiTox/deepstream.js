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


export class Exporter extends PassThrough{
    
    private writers:{
        [key:string]:{
            iteration:number;
            count:number;
            writer:fs.WriteStream;            
        }
    } = {}

    private ReaderP:{path:string|Buffer, it:number}[] = [];
    private connected = false;

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
            }

            if(writer.count >= data.shape.reduce((a,b)=>a*b)){
                writer.writer.end();                
                writer.writer.once("finish", ()=>{
                    writer.writer.close()
                    this.ReaderP.push({path:writer.writer.path, it:writer.iteration});
                    this.connect();
                })
            }
        })
    }  
    
    connect(){
        if(!this.connected){
            const readerp = this.ReaderP.shift();
            if(readerp){
                const reader = fs.createReadStream(readerp.path, {highWaterMark:100});
                reader.pipe(new LineParser()).pipe(this.connectTo, {end:false});
                this.connected = true;
                reader.once("end", ()=>{
                    this.connected = false;
                    this.connect();
                    if(readerp.it % this.saveAt_iteration != 0){
                        fs.unlink(reader.path, (err)=>{
                            if(err) throw err;
                        })
                    }
                })
            }
        }
    }

    get_writer(key:string){
        if(!(key in this.writers)){
            this.writers[key] = {
                iteration: Number.parseInt(key),
                count:0,
                writer:fs.createWriteStream(join(__dirname, "/saves/"+this.name+key+".txt"))
            }
            this.writers[key].writer.on("drain", ()=>{
                this.resume();
            })
        }

        return this.writers[key];
    }
}


export class Controller extends EventEmitter{
    
    constructor(private saveAt_iteration:number = 10){
        super();
        if(!fs.existsSync(join(__dirname, "/saves"))){
            fs.mkdirSync(join(__dirname, "/saves"))
        }

        process.on("beforeExit", ()=>{
            console.log(this.writers)
        })
    } 

    private writers:{
        [key:string]:{
            iteration:number;
            count:number;
            writer:fs.WriteStream;            
        }
    } = {}

    private lines:{
        [name:string]:{
            name:string;
            in:Transform;
            Queue:{path:string|Buffer, it:number}[];
            out:Transform;
            finished:boolean;
            connected:boolean;
        }
    } = {}

    
    
    addLine(name:string, In:Transform, Out:Transform){
        this.lines[name] = {
            name: name,
            in: In,
            Queue:[],
            out: Out,
            connected: false,
            finished: false
        }

        this.lines[name].in.on("data", (data:data)=>{
            const key = this.lines[name].name + "_" + data.iteration;        
            const writer = this.get_writer(key);
            
            const isSuccess = writer.writer.write(JSON.stringify(data) + "\n");
            writer.count+=1;


            if(!isSuccess){
                this.lines[name].in.pause();
                writer.writer.once("drain", ()=>{
                    this.lines[name].in.resume();
                })
            }

            if(writer.count >= data.shape.reduce((a,b)=>a*b)){                
                writer.writer.end();                
                writer.writer.once("finish", ()=>{
                    console.log("end", this.lines[name].name);
                    writer.writer.close();
                    this.lines[name].finished = true;
                    this.lines[name].Queue.push({path:writer.writer.path, it:writer.iteration});
                    delete this.writers[key];
                    this.connect();
                })
            }
        })
    }

     
    

    connect(){
        
        let finished = true;
        for(const line in this.lines){
            console.log("[lines]", this.lines[line].name, this.lines[line].finished)
            finished &&= this.lines[line].finished;
        }

        if(finished){

            let connected = false;
            for(const line in this.lines){
                connected = this.lines[line].connected;
            }

            if(!connected){

                for(const line in this.lines){
                    const current_line = this.lines[line];
                    const readerp = current_line.Queue.shift();
                    if(readerp){
                        const reader = fs.createReadStream(readerp.path, {highWaterMark:100});
                        const lineParser = new LineParser();
                        reader.pipe(lineParser).pipe(current_line.out, {end:false});
                        
                        
                        current_line.connected = true;
                        current_line.finished = false;
                        console.log("[connected]", this.lines[line].name, this.lines[line].connected)
                        
                        reader.once("end", ()=>{
                            reader.unpipe();
                            lineParser.unpipe();
                            reader.destroy();
                            lineParser.destroy();
    
                            current_line.connected = false;
                            this.connect();
    
                            if(readerp.it % this.saveAt_iteration != 0){
                                fs.unlink(reader.path, (err)=>{
                                    if(err) throw err;
                                })
                            }
                        })
                    }
                }

            }

        }
    }

    get_writer(key:string){
        if(!(key in this.writers)){
            this.writers[key] = {
                iteration: Number.parseInt(key),
                count:0,
                writer:fs.createWriteStream(join(__dirname, "/saves/"+key+".txt"))
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