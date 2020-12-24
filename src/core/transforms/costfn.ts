import { Transform, TransformCallback, Readable } from "stream";
import { add, sub, multiply } from "./_basic";
import { changeId } from "./_transform_utils";
import { data } from "./data.interface";
import { applyfn } from "./_apply_fn";

// export const t ={
//     Quadraticfn: {
//         fn: (a=[], y=[]) =>{  
//             const totalErr = [];        
//             for(let i = 0; i < a.length; i++){           
//                 totalErr[i] = 0.5 * (a[i] - y[i])**2;                             
//             }
//             return totalErr  
//         },
//         delta: (a=[], y=[], z=[]) => {
//             let res = [];
//             for(i = 0; i < a.length; i++){
//                 res[i] = (a[i]-y[i]) * z[i]
//             }
//             return res
//         },
//         totalerr: (err=[]) => {            
//             let Err = 0;
//             for(let e = 0; e < err.length; e++){
//                 Err += err[e];
//             }
//             return Err/err.length
//         }
//     },

//     CrossEntropyfn: {
//         fn: (a, y) =>{    
//             const totalErr = [];        
//             for(let i = 0; i < a.length; i++){           
//                 totalErr[i] = (y[i] * Math.log(a[i])) + ((1 - y[i]) * Math.log(1 - a[i]))             
//             }
//             return totalErr             
//         },
//         delta: (a=[], y=[], z=[]) => {
//             let res = [];
//             for(i = 0; i < a.length; i++){
//                 res[i] = (a[i]-y[i])
//             }
//             return res
//         },
//         totalerr: (err=[]) => {
//             let Err = 0;
//             for(let e = 0; e < err.length; e++){
//                 Err += err[e];
//             }
//             return -1 * (Err/err.length)
//         }
//     }
// }

export type costfn = "CrossEntropy costfn"

export function CrossEntropyfn(){
    return {
        fn:(a:Readable|Transform, y:Readable|Transform)=>{
            // (y * Math.log(a)) + ((1 - y) * Math.log(1 - a))
            
            const inter1 = multiply(changeId(y, 0), 0, changeId(applyfn(a, Math.log), 1), 1)
            const inter2 = applyfn(y, (y)=>{return 1-y});
            const inter3 = applyfn(a, (a)=>{return Math.log(1-a)});
            
            return add(
                changeId(inter1, 0), 0,
                changeId(multiply(changeId(inter2, 0), 0, changeId(inter3, 1), 1), 1), 1,
            )
        },

        delta:(a:Readable|Transform, y:Readable|Transform) => {
            // a - y
            return sub(changeId(a, 0), 0, changeId(y, 1), 1)
        }
    }
}


