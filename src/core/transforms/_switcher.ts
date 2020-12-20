import { PassThrough, Readable, Transform, TransformCallback } from "stream";
import { data } from "./data.interface";
import { Memory } from "./_memory";

export class Switcher extends PassThrough{
    private tot_fs = 0;
    private current_fs = 0;
    private tot_ss = 0;
    private current_ss = 0;

    constructor(
        private FirstStream:Readable|Transform,
        private SecondStream:Readable|Transform,
    ){
        super({objectMode:true, highWaterMark:3});
        this.init_stream()
    }

    init_stream(){
        // 0, 1,
        // 0, 1, 2, 3, 4

        this.FirstStream.on("data", (data:data)=>{  
            this.tot_fs = data.shape.reduce((a, b)=>a*b);
            this.current_fs += 1;
            // console.log("first", this.current_fs, this.tot_fs)
            

            const lowest = this.tot_fs <= this.tot_ss ? this.tot_fs : this.tot_ss;            
            if(
                this.current_fs >= lowest && this.current_ss >= lowest &&
                this.tot_fs != 0 && this.tot_ss != 0            
            ){
                if(this.tot_fs > this.tot_ss){
                    this.pause_ss(data);
                }else{
                    this.pause_fs(data);
                }                
            }else{
                this.pause_fs(data);             
            }    
            
            if(this.current_fs >= this.tot_fs && this.current_ss >= this.tot_ss) this.reset()
            

        })

        this.SecondStream.on("data", (data:data)=>{      
            this.tot_ss = data.shape.reduce((a, b)=>a*b);
            this.current_ss += 1;
            // console.log("second", this.current_ss, this.tot_ss)
                        
            const lowest = this.tot_fs <= this.tot_ss ? this.tot_fs : this.tot_ss;            
            if(
                this.current_fs >= lowest && this.current_ss >= lowest &&
                this.tot_fs != 0 && this.tot_ss != 0            
            ){
                if(this.tot_fs > this.tot_ss){
                    this.pause_ss(data);
                }else{
                    this.pause_fs(data);
                }                
            }else{
                this.pause_ss(data);             
            }  

            if(this.current_fs >= this.tot_fs && this.current_ss >= this.tot_ss) this.reset()

        })
        
    }

    reset(){
        this.current_fs = 0;
        this.current_ss = 0;
    }

    pause_fs(data:data){
        this.FirstStream.pause();
        this.SecondStream.resume();
        
        const isSuccess = this.write(data);                    
        
        if(!isSuccess){
            this.SecondStream.pause();   
            
            this.once("drain", ()=>{
                this.SecondStream.resume();
            }) 
        }
    }

    pause_ss(data:data){
        this.SecondStream.pause();
        this.FirstStream.resume();  
        
        const isSuccess = this.write(data);
        
        if(!isSuccess){
            this.FirstStream.pause();

            this.once("drain", ()=>{
                this.FirstStream.resume();
            }) 
        } 
    }
}

class Switcher_old extends PassThrough{
    constructor(
        private FirstStream:Readable|Transform,
        private SecondStream:Readable|Transform,
    ){
        super({objectMode:true, highWaterMark:5});  
        this.init_stream()                 
    }

    init_stream(){
        // 0, 1,
        // 0, 1, 2, 3, 4

        this.FirstStream.on("data", (data:data)=>{  
            this.pause_fs(data);
        })

        this.SecondStream.on("data", (data:data)=>{      
            this.pause_ss(data);           
        })
        
    }

    pause_fs(data:data){
        this.FirstStream.pause();
        this.SecondStream.resume();
        
        const isSuccess = this.write(data);                    
        
        if(!isSuccess){
            this.SecondStream.pause();   
            
            this.once("drain", ()=>{
                this.SecondStream.resume();
            }) 
        }
    }

    pause_ss(data:data){
        this.SecondStream.pause();
        this.FirstStream.resume();  
        
        const isSuccess = this.write(data);
        
        if(!isSuccess){
            this.FirstStream.pause();

            this.once("drain", ()=>{
                this.FirstStream.resume();
            }) 
        } 
    }
}

export function switcher(a:Readable|Transform, aid:number, b:Readable|Transform, bid:number){
    // const switcher = new Switcher(a, b);
    // return switcher;

    const passer = new PassThrough({objectMode:true, highWaterMark:3});
    a.once("readable", ()=>{
        a.pipe(passer, {end:false});
        b.pipe(passer, {end:false});
    })
    return passer

    // const delayA = new Memory();
    // const delayB = new Memory();

    // a.pipe(delayA.inline);
    // b.pipe(delayB.inline);

    // const switcher = new Switcher(delayA.outline, delayB.outline);
    // return switcher;
}