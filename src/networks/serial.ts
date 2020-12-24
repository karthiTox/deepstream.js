import { join } from "path";
import * as fs from "graceful-fs";

import { PassThrough, Readable, Transform } from "stream";
import { layer } from "../layers/layers";
import { AllowOnly, formatMemory, log, logfn } from "../core/transforms/log";
import { costfn, CrossEntropyfn } from "../core/transforms/costfn";
import { Counter, LineParser, LineStringify, mulwith } from "../core/transforms/_transform_utils";
import { reduce } from "../core/transforms/_reducer";
import { data } from "../core/transforms/data.interface";


interface serial_options{
    log_loss:boolean;
    log_loss_at:number;
    loss:costfn;
    optimizer:"sgd";
}

class Serial{

    private layers:layer[] = [];
    
    private OPTIONS:serial_options = {
        log_loss:true,
        log_loss_at:10,
        loss:"CrossEntropy costfn",
        optimizer:"sgd"
    }

    constructor( options?:serial_options ) {
        this.OPTIONS = Object.assign(this.OPTIONS, options);
        
        fs.rmdirSync(join(__dirname, "/temp_pool"), {recursive:true});                
        
        process.on("beforeExit", ()=>{
            try {
                fs.rmdirSync(join(__dirname, "/temp_pool"), {recursive:true});                
            }catch{
                console.warn("temp_pool is not deleted...")
            }
        })

    }

    add(layer:layer){
        this.layers.push(layer);
    }

    /**
     * compile() method will pipe the streams together to do math operations
     * 
     * @param input Input stream to the model
     * @param output Output stream to the model
     */

    private inputs:Readable[] = [];
    private outputs:Readable[] = [];
    
    public outline = new PassThrough({objectMode:true, highWaterMark:1});

    train(
        input:(Readable|Transform)[], output:(Readable|Transform)[], 
    ){        
        this.inputs = input;
        this.outputs = output;

        this.create()
    }

    
    private create(
        i = 0
    ) {
        if(!this.inputs[i]) return;
    
        let ip:any = this.inputs[i];
        this.layers.forEach(layer => {
            ip = layer.feed(ip);
        })
    
        ip.pipe(this.outline, {end:false});

        let grad = this.compare(ip, this.outputs[i]);
    
        const co = new Counter("grad")
        
        grad.pipe(co).pipe(new LineStringify()).pipe(fs.createWriteStream(join(__dirname, "/grad.txt")));
    
        co.emitter.once("finished", ()=>{
            ip.unpipe();
        
            let op:any = fs.createReadStream(join(__dirname, "/grad.txt")).pipe(new LineParser());
            for (let l = this.layers.length - 1; l >= 0; l--) {            
                op = this.layers[l].back(op);
            }
            
            const ca = new Counter("grada")
        
            op.pipe(ca).pipe(log(false));
    
            ca.emitter.once("finished", ()=>{
                this.create(i+1);
            })
        })
    }
    
    private compare(result:Readable|Transform, output:Readable|Transform){        
        const costfn = CrossEntropyfn();
        const op = costfn.delta(result, output);        
        
        if(this.OPTIONS.log_loss){
            mulwith(reduce(costfn.fn(result, output), (a, b)=>a+b, true), -1)
                .pipe(AllowOnly("iteration", this.OPTIONS.log_loss_at))
                .pipe(logfn((data:data)=>{
                    console.log(
                        "iteration:",data.iteration,
                        "Total loss:",data.value, 
                        "Memory Usage:",formatMemory(process.memoryUsage().heapUsed),"MB"
                    )
                }))
        }

        return op;
    }
}

export function serial(op:serial_options){
    return new Serial(op);
}

