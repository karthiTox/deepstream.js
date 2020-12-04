// import { Transform, TransformCallback } from "stream";

import { Readable } from "stream";
import { data } from "./data.interface";
import { logger } from "./log";
import { add } from "./_basic";

// class Reader extends Transform{
//     _transform(text:string, en:BufferEncoding, next:TransformCallback){
        
//     }
// }


const a = new Readable({objectMode:true, read(){}})
const b = new Readable({objectMode:true, read(){}})

add(a, 0, b, 1).pipe(logger("test", true));

for(let i = 0; i < 10; i++){
    a.push(<data>{
        id:0,
        index:i,
        iteration:i,
        value:Math.random(),
        shape:[2, 2]
    })
    a.push(<data>{
        id:0,
        index:i+10,
        iteration:i,
        value:Math.random(),
        shape:[2, 2]
    })
    b.push(<data>{
        id:1,
        index:i,
        iteration:i,
        value:1,
        shape:[2, 2]
    })
    b.push(<data>{
        id:1,
        index:i+10,
        iteration:i,
        value:Math.random(),
        shape:[2, 2]
    })

}