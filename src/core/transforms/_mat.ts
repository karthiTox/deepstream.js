import { PassThrough, Readable, Stream, Transform, TransformCallback, TransformOptions, Writable} from "stream"
import * as fs from "graceful-fs"
import { data } from "./data.interface";
import {_cindex, _cstep, _cstep_change, _findIndex} from "./utils"
import { switcher } from "./_switcher";
import { create_writer, formatMemory } from "./log";
import { Memory, OneShotMemory } from "./_memory";
import { memory } from "console";
import { LineParser, LineStringify } from "./_transform_utils";
import { join } from "path";
import { writer } from "repl";
// import * as gfs from "graceful-fs";

export class Transposer extends Transform{
    constructor(){
        super({objectMode:true, highWaterMark:1});               
    }

    _transform(data:data, e:BufferEncoding, next:TransformCallback){  
        data = JSON.parse(JSON.stringify(data))      
        const shape = data.shape;
        const step = _cstep(data.shape);
        const op_shape = JSON.parse(JSON.stringify(data.shape)).reverse();
        
        let index = _findIndex(shape, step, data.index)        
        let res = _cindex( index.reverse(), _cstep(op_shape) );
    
        data.index = res;
        data.shape = op_shape;

        this.push(JSON.parse(JSON.stringify(data)));
        next();
    }
}

export function transpose(a:Readable|Transform){
    const transposer = new Transposer();
    a.pipe(transposer);
    return transposer;
}

export class IndexFinder extends Transform{
    private i:number|null = null; 
    private j:number|null = null; 
    private k:number|null = null; 

    private waitings:{[id:number]:data[]} = {}
    constructor(
        private fid:number,
        private sid:number,
        private log:boolean,
    ){
        super({objectMode:true, highWaterMark:1});
        this.waitings[fid] = [];
        this.waitings[sid] = [];

        process.on("beforeExit", ()=>{
            if(this.log) console.log(this.i , this.j, this.k)
        })
    }

    _transform(data:data, e:BufferEncoding, next:TransformCallback){ 
        data = JSON.parse(JSON.stringify(data))
        if(this.log) console.log(JSON.stringify(data))

        
        // finding i, j, k, output_shape
        if(!this.i || !this.j || !this.k){
            if(data.id == this.fid){
                this.i = data.shape[0];
                this.j = data.shape[1];
            }
            else if(data.id == this.sid){                
                this.k = data.shape[1];
            }
        }
        
        // update waiting
        if(!this.i || !this.j|| !this.k){     
            this.waitings[data.id].push(data);
            return next();            
        }

        if(this.i && this.j && this.k){
            this.push_results(data);
            
            if(this.waitings[this.fid].length > 0 || this.waitings[this.sid].length > 0){
                this.waitings[this.fid].forEach(d => this.push_results(d))
                this.waitings[this.sid].forEach(d => this.push_results(d))
                this.waitings[this.fid] = [];
                this.waitings[this.sid] = [];
            }
        }                      
        

        next();
    }

    push_results(data:data){                   
        const index = _findIndex(data.shape, _cstep(data.shape), data.index);
        const push:any = Object.assign({}, data);
        push.j = data.id == this.fid ? index[1] : index[0];                                      
        push.tot_i = this.i;
        push.tot_j = this.j;                                        
        push.tot_k = this.k;        
        this.push(JSON.parse(JSON.stringify(push)))
    }
}

export class Bridge{
    private connected = false;    

    private writters:{
        [iteration:number]:{
            [key:string]:{
                id:number;
                index:number;
                reader:string;                
                writter:fs.WriteStream;
                count:number;
            }
        }
    } = {}

    private reader:{
        [iteration:number]:{
            i:number;
            j:number;
            path:{
                [A:number]:string[]
            }
        }
    } = {};

    constructor(private from:Transform|Readable, private to:Transform|Writable, private fid:number, private sid:number){
        if(!fs.existsSync(join(__dirname, "/temp_pool"))){
            fs.mkdirSync(join(__dirname, "/temp_pool"))
        }
        
        const pather = new Transform({ objectMode:true, highWaterMark:1 })
        pather._transform = (data:any, en:BufferEncoding, next)=>{            
            const isfirst = data.id == this.fid ? true : false
            
            const full_index = _findIndex(data.shape, _cstep(data.shape), data.index);
            const index = full_index[ isfirst ? 0 : 1 ];
            
            
            const key = "" + data.id + index;
            const writter = this.getWriter(key, index, data);            
            
            writter.writter.once("error", (err)=>{console.log("err")})
            console.log(JSON.stringify(data))
            const isPushed = writter.writter.write(JSON.stringify(data)+"\n");
            writter.count += 1;
            
            if(!isPushed) if(!this.from.isPaused()) this.from.pause();            
            
            if(writter.count == ( isfirst ? data.tot_i : data.tot_k )){
                console.count("closed")            
                writter.count = 0;
                writter.writter.close();
                writter.writter.end();
                
                const reader = this.get_reader(data.iteration);
                reader.path[writter.id][writter.index] = writter.reader;
                
                if(
                    reader.path[this.fid].length == data.tot_i && 
                    reader.path[this.sid].length == data.tot_k
                ){
                    this.connect_to(data.iteration);                    
                }
                
                delete this.writters[data.iteration][key];       
            }                                                                            
            
            next();
        }
        
        this.from.pipe(pather);         
    }

    connect_to(iteration:number){          
        const reader = this.reader[iteration]
        const f = reader.path[this.fid][reader.i];
        const s = reader.path[this.sid][reader.j];

        if(!f || !s){             
            reader.path[this.fid].forEach(p => {
                fs.unlinkSync(p)        
            });
            reader.path[this.sid].forEach(p => {
                fs.unlinkSync(p)        
            });
            return 
        }
        
        const changeIndex = () => {
            return new Transform({
                objectMode:true, 
                highWaterMark:1, 
                transform(data:data, en, next){
                    data.index = _cindex([reader.i, reader.j], _cstep(data.shape));
                    this.push(data);
                    next();
                }
            })
        }

        const readerA = fs.createReadStream(f, {highWaterMark:1000})
        const readerB = fs.createReadStream(s, {highWaterMark:1000})
        readerA.pipe(new LineParser()).pipe(changeIndex()).pipe(this.to, {end:false});
        readerB.pipe(new LineParser()).pipe(changeIndex()).pipe(this.to, {end:false});
        this.connected = true;

        const close = ()=>{
            if(this.connected == false){
                this.next(reader);
                this.connect_to(iteration);
            }else{
                this.connected = false;            
            }
        }
        
        readerB.once("close", close)
        readerA.once("close", close)
    } 
    
    next(reader:any){
        if(reader.j < reader.path[this.sid].length-1){ 
            reader.j += 1;
        }    
        else {
            reader.i += 1
            reader.j = 0
        };            
    }

    get_reader(iteration:number){
        if(!(iteration in this.reader)){
            this.reader[iteration] = {
                i:0,
                j:0,
                path:{
                    [this.fid]:[],
                    [this.sid]:[]
                }
            }
        }

        return this.reader[iteration]
    }

    
    getWriter(key:string, index:number, data:any){
        if(!(data.iteration in this.writters)){
            this.writters[data.iteration] = {};                              
        }
        
        if(!(key in this.writters[data.iteration])){
            const name = this.get_name()
            this.writters[data.iteration][key] = {
                id:data.id,
                index:index,
                count:0,
                reader:name,
                writter:this.create_writter(name),
            }
        }  

        return this.writters[data.iteration][key]
    }

    create_writter(name:string){
        console.count("created")
        const writter = fs.createWriteStream(name, {highWaterMark:10}); 
        writter.on("drain", () =>{ if(this.from.isPaused()) this.from.resume() })

        return writter;
    }

    get_name(){
        return join(__dirname, "/temp_pool/temp"+Math.random()+".txt");
    }

}

export class BridgeV2{  

    private writers:{
        [key:string]:{
            id:number;
            index:number;
            path:string;                
            writer:fs.WriteStream|Writable;
            count:number;
            used:number;
        }
    } = {}

    private connected1 = false;
    private connected2 = false;

    private placed:{
        [key:string]:boolean
    } = {}

    private blocks:{
        index:number[];
        pathA:string;
        pathB:string;    
    }[] = []

    private i:number = 1;
    private k:number = 1;

    private pathed:{
        a:{ [path:string]:number; },
        b:{ [path:string]:number; }
    } = {
        a:{},
        b:{},
    };

    private pather = new PassThrough({ objectMode:true, highWaterMark:1 });

    constructor(
        private from:Transform, 
        private to:Transform|Writable, 
        private fid:number, 
        private sid:number,
        private log:boolean,
    ){
        if(!fs.existsSync(join(__dirname, "/temp_pool"))) fs.mkdirSync(join(__dirname, "/temp_pool")) 
        
        this.pather.on("data", (data:any) =>{       
            const isfirst = data.id == this.fid ? true : false            
            const [row, col] = _findIndex(data.shape, _cstep(data.shape), data.index);             

            const key = "" + data.iteration + data.id + (isfirst ? row : col);            
            if(!(key in this.writers)){
                const path = this.get_name()
                this.writers[key] = {
                    id:data.id,
                    index: isfirst ? row : col,
                    count:0,
                    used:0,
                    path:path,
                    writer:this.create_writter(path),
                }
                this.writers[key].writer.on("error", (err)=>{
                    console.log(data, this.log);
                })
            }  

            this.i = data.tot_i;
            this.k = data.tot_k;

            const writer = this.writers[key];

            const isSuccess = writer.writer.write(JSON.stringify(data) + "\n");                       
            writer.count += 1;
            if(!isSuccess){
                this.pather.pause();
                this.check(1000);
            }

            if(writer.count >= data.tot_j){                          
                writer.writer.end();
                writer.count = 0;
                // console.log(formatMemory(process.memoryUsage().heapUsed), "MB")
                             
                writer.writer.once("finish", ()=>{                    
                    if(isfirst){
                        for(let c = 0; c < data.tot_k; c++){
                            const bkey = "" + data.iteration + this.sid + c;
                            if(bkey in this.writers && this.writers[bkey].writer.writableFinished){
                                const block_key = "" + data.iteration +"_"+ this.writers[key].index +"_"+ this.writers[bkey].index
                                const prev_key = "" + (data.iteration<=0?data.iteration:data.iteration-1) +"_"+ this.writers[key].index +"_"+ this.writers[bkey].index
                                
                                if(!(block_key in this.placed)){
                                    this.blocks.push({
                                        index:[this.writers[key].index, this.writers[bkey].index],
                                        pathA:this.writers[key].path,
                                        pathB:this.writers[bkey].path
                                    })      

                                    // if(this.log) console.log([this.writers[key].index, this.writers[bkey].index])

                                    this.writers[key].used += 1;
                                    this.writers[bkey].used += 1;
                                    this.placed[block_key] = true;
                                    
                                    if(data.iteration > 0){
                                        delete this.placed[prev_key];
                                        if(this.writers[key].used >= this.k)
                                            delete this.writers[key];       
                                        if(this.writers[bkey].used >= this.i)
                                            delete this.writers[bkey];                                    
                                    }
                                }
                            }
                        }
                    }else{
                        for(let r = 0; r < data.tot_i; r++){
                            const akey = "" + data.iteration + this.fid + r;
                            if(akey in this.writers && this.writers[akey].writer.writableFinished){
                                const block_key = "" + data.iteration +"_"+ this.writers[akey].index +"_"+ this.writers[key].index
                                const prev_key = "" + (data.iteration<=0?data.iteration:data.iteration-1) +"_"+ this.writers[akey].index +"_"+ this.writers[key].index
                                
                                if(!(block_key in this.placed)){
                                    this.blocks.push({
                                        index:[this.writers[akey].index, this.writers[key].index],
                                        pathA:this.writers[akey].path,
                                        pathB:this.writers[key].path
                                    })
                                    
                                    // if(this.log) console.log([this.writers[akey].index, this.writers[key].index])

                                    this.writers[key].used += 1;
                                    this.writers[akey].used += 1;
                                    this.placed[block_key] = true;
                                    
                                    if(data.iteration > 0){
                                        delete this.placed[prev_key];
                                        if(this.writers[akey].used >= this.k)
                                            delete this.writers[akey];
                                        if(this.writers[key].used >= this.i)
                                            delete this.writers[key];
                                    }       
                                }
                            }
                        }
                    }
    
                    this.connect()
                })

            }                                                                            
                        
        })
        
        this.from.pipe(this.pather);       
    }

    private isCheckeractive = false;
    check(after:number){
        if(!this.isCheckeractive){
            this.isCheckeractive = true
            setTimeout(()=>{
                if(this.pather.isPaused()) this.pather.resume();
                this.isCheckeractive = false
            }, after)
        }
    }

    setPath(path:string, a:number){
        if(a == 0){
            if(path in this.pathed.a) this.pathed.a[path] += 1;
            else this.pathed.a[path] = 1;
        }else if(a == 1){
            if(path in this.pathed.b) this.pathed.b[path] += 1;
            else this.pathed.b[path] = 1;
        }
    }

    connect(){
        if(!this.connected1 && !this.connected2){            
            const block = this.blocks.shift();
            if(!block) return;            

            const readerA = fs.createReadStream(block.pathA, {highWaterMark:100});            
            const readerB = fs.createReadStream(block.pathB, {highWaterMark:100});                        
            this.setPath(block.pathA, 0);
            this.setPath(block.pathB, 1);
            this.connected1 = true;
            this.connected2 = true;            

            const changeIndex = () => {
                return new Transform({
                    objectMode:true, 
                    highWaterMark:1,                     
                    transform(data:any, en, next){
                        data.shape = [data.tot_i, data.tot_k]
                        data.index = _cindex(block.index, _cstep(data.shape));
                        this.push(data);
                        next();
                    }
                })
            }

            const changeIndexA = changeIndex();
            const changeIndexB = changeIndex();
            const lineParserA = new LineParser();
            const lineParserB = new LineParser();
            readerA.pipe(lineParserA).pipe(changeIndexA).pipe(this.to, {end:false});
            readerB.pipe(lineParserB).pipe(changeIndexB).pipe(this.to, {end:false});
            if(this.log) console.log(this.i, this.k);
            readerA.once("end", ()=>{    
                this.connected1 = false;
                this.connect();
            })            
            readerB.once("end", ()=>{
                this.connected2 = false;                
                this.connect();
            })

            readerA.once("close", ()=>{                
                if(this.pathed.a[block.pathA] >= this.k){
                    fs.unlink(block.pathA, (err) => {
                        if(err) throw err;

                        delete this.pathed.a[block.pathA];
                    })
                }
            })
            readerB.once("close", ()=>{                
                if(this.pathed.b[block.pathB] >= this.i){
                    fs.unlink(block.pathB, (err) => {
                        if(err) throw err;
                        
                        delete this.pathed.b[block.pathB];
                    })
                }
            })

        }
    }

    create_writter(name:string){                
        const writer = fs.createWriteStream(name, {highWaterMark:1000});        
        const ls = new LineStringify();               
        // const mem = new Memory();
        ls.pipe(writer);
        writer.on("drain", ()=>{
            if(this.pather.isPaused()) this.pather.resume();
        })         
        return writer;
    }

    get_name(){
        return join(__dirname, "/temp_pool/temp"+Math.random()+".txt");
    }

}


export class Reducer extends Transform{
    private waitings:{
        [index:string]:{
            tot:number;
            count:number;
            values:{
                [j:number]:number
            };
        }
    } = {};

    constructor(private log:boolean){
        super({objectMode:true, highWaterMark:1});
        
    }

    _transform(data:any, e:BufferEncoding, next:TransformCallback){ 
        if(this.log) console.log("==>", JSON.stringify(data));
               
        data = JSON.parse(JSON.stringify(data))
        // console.log(data.iteration, data.index)
        const index = JSON.stringify(data.iteration) + JSON.stringify(data.index)                           
        
        // initalizing
        if(!(index in this.waitings)){
            this.waitings[index] = { values:{}, count:0, tot:0 }
        }

        const waiting = this.waitings[index];
        
        // reducing
        if(data.j in waiting.values){                
            waiting.tot += waiting.values[data.j] * data.value;
            waiting.count++;                                  
            delete this.waitings[index].values[data.j];
            waiting.values[data.j] = data.value;
        }else{              
            waiting.values[data.j] = data.value;
        }            

        // push the res to readable stream
        if(waiting.count == data.tot_j){          
            this.push(<data>JSON.parse(JSON.stringify({
                id:0,
                index:data.index, 
                iteration:data.iteration,
                value:waiting.tot, 
                shape:data.shape, 
            })))  
            delete this.waitings[index]                                        
        }         

        next();
    }
}

export function matmul(a:Readable|Transform, aid:number, b:Readable|Transform, bid:number, log = false){
    const mapper = new IndexFinder(aid, bid, log);
    const reducer = new Reducer(false);
    const switched = switcher(a, aid, b, bid); 
    switched.pipe(mapper);
    // a.pipe(mapper, {end:false});
    // b.pipe(mapper, {end:false});
    const bridge = new BridgeV2(mapper, reducer, aid, bid, log);
    return reducer;
    
    // const mapper = new Mapper(aid, bid);
    // const reducer = new Reducer();
    // const bridge = new Bridge(mapper, reducer);
    // const switched = switcher(a, aid, b, bid);
    // switched.pipe(mapper).pipe(bridge);
    // return reducer;
}