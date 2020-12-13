import { PassThrough, Readable, Transform, TransformCallback } from "stream";
import { data } from "./data.interface";

export class Switcher extends PassThrough{
    constructor(
        private FirstStream:Readable|Transform,
        private SecondStream:Readable|Transform,
    ){
        super({objectMode:true, highWaterMark:3});  
        this.init_stream()
        this.on("drain", ()=>{
            this.FirstStream.resume();
            this.SecondStream.resume();
        })          
    }

    init_stream(){
        this.FirstStream.on("data", (data:data)=>{            
            this.FirstStream.pause();
            this.SecondStream.resume();
            
            const isSuccess = this.write(data);                    
            
            if(!isSuccess){
                this.SecondStream.pause();   
                
                
            }

        })

        this.SecondStream.on("data", (data:data)=>{            
            this.SecondStream.pause();
            this.FirstStream.resume();  
            
            const isSuccess = this.write(data);
            
            if(!isSuccess){
                this.FirstStream.pause();
            }            
        })
        
    }

}

export function switcher(a:Readable|Transform, aid:number, b:Readable|Transform, bid:number){
    const switcher = new Switcher(a, b);    
    return switcher;
}