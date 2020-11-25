import { Transform } from "stream";
import { _sub } from "../core/transforms/_basic";
import { vertex } from "../core/vertex";

export function comparator(res:vertex, op:vertex){
    const logger = new Transform(
        {
            objectMode:true,
            highWaterMark:10000,
            transform(chunk, en, next){
                if(chunk[3] > 9999) console.timeEnd('t')
                chunk[1] -= 1;                
                chunk[2] -= res.grad_details.id;                
                this.push(chunk)
                next();
            }
        }
    )
    // const subtractor = new _sub({objectMode:true, highWaterMark:10000}, res.grad_details)

    res.stream.pipe(logger);
    // res.stream.pipe(subtractor);
    // op.stream.pipe(subtractor);
    
    logger.pipe(res.grad);
}

export function construct(res:vertex){
    res.back();
    res.parents.forEach(parent => {
        construct(parent);
    })
}