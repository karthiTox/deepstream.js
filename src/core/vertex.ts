import { ReadStream } from "fs";
import {Readable, Stream, Transform, Writable} from "stream";

export interface _details{
    id:number;
    shape:number[];
    step:number[];
}

export function genId():number{
    return Math.floor(Math.random()*1000);
}


export function genDetails(shape:number[], id?:number):_details{
    return {
        id: id? id : genId(),
        shape: shape,
        step: _cstep(shape)
    };
}

export class vertex{
    public grad;
    public details:_details = {
        id: genId(),
        shape:[],
        step:[],
    }
    public grad_details:_details;

    constructor(public stream:any, details:_details, public parents:vertex[] = [], grad?:Transform){
        // intializing grad stream
        if(grad){ 
            this.grad = grad
        }else{
            this.grad = new Transform({
                objectMode:true,
            })
            this.grad._transform = (data, en, next) => {
                this.grad.push(data);
                next();
            }
        }        
        
        // intializing grad_details
        this.grad_details = {
            id: genId(),
            shape: details.shape,
            step: details.step,
        }        

        // changing details
        if(details){
            this.details.id = details.id
            this.details.shape = details.shape;
            this.details.step = details.step;
        }
    }

    back():void{

    }
}

export function createVertex(stream:Readable|Transform, Shape:number[], Id?:number){
    return new vertex(stream, {id: Id? Id : genId(), shape:Shape, step:_cstep(Shape)})
}