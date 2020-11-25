import { 
    Transform, 
    Readable, 
    Writable, 
    WritableOptions, 
    ReadableOptions, 
    TransformOptions, 
    TransformCallback, 
} from "stream";
import { dataWriter } from "../log";

export class _memory{
    private in_;
    private out_;
    private middle_;
    
    /**
     * Warning:- this creates more readable streams when you set 'highWaterMark' less than 10.     
     */
    constructor(
        private name:string,
        writableOptions:WritableOptions = {objectMode:true}, 
        private readableOption:ReadableOptions = {objectMode:true}, 
        outputTransformOptions:TransformOptions = {objectMode:true},
    ){
        this.in_ = new Writable(writableOptions);
        
        this.out_ = new Transform(outputTransformOptions);
        this.out_._transform = (data:any, en:BufferEncoding, next:TransformCallback) => {
            this.out_.push(data);
            next();
        }

        this.middle_ = this.create_container()
        this.middle_.pipe(this.out_)

        // this.count = 1;
        this.in_._write = (data:any, en:BufferEncoding, next:TransformCallback) => {
            const res = this.middle_.push(data);
            // dataWriter.write("total "+this.count+" data pushed " + name)                         
            // this.count++
            if(res == false){      
                // dataWriter.write("loaded new container " + name)
                // this.count = 0;                         
                this.middle_ = this.create_container()
                this.middle_.pipe(this.out_)
                this.middle_.push(data)
            }

            next()
        }
    }

    create_container():Readable{
        const container = new Readable(this.readableOption); 
        container._read = ()=>{}       
        return container;
    }

    get_input_line():Writable{
        return this.in_;
    }

    get_output_line():Transform{
        return this.out_;
    }
}