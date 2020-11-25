import { Readable } from "stream";
import { add, multiply, sub } from "./basic";
import { logger } from "./log";
import { _cstep, _mapper, _reducer, _transpose} from "./transforms/_mat";
import { genId, vertex } from "./vertex";
import { _memory } from "./transforms/_memory"
import { matmul2d, transpose } from "./mat";
import { apply_act } from "./apply_act";
import { sig, sigPrime } from "./activations";

const r = new Readable({objectMode:true, read(){}});
const a = new vertex(r, {id:0, shape:[2, 2], step:[2, 1]});


const r1 = new Readable({objectMode:true, read(){}});
const b = new vertex(r1, {id:1, shape:[2, 2], step:[2, 1]});

const res = matmul2d(a, b);
res.back();

// res.stream.pipe(logger("res"))
a.grad.pipe(logger("grad"));
// res.stream.pipe(res.grad)

for(let i = 0; i < 30; i++){
    a.stream.push([0, 1, 0, i])
    
    a.stream.push([1, 1, 0, i])
    a.stream.push([2, 1, 0, i])
    a.stream.push([3, 1, 0, i])

    
    
    b.stream.push([0, 1, 1, i])
    b.stream.push([1, 1, 1, i])
    b.stream.push([2, 1, 1, i])
    b.stream.push([3, 1, 1, i])



    res.grad.push([0, 1, res.grad_details.id, i])
    res.grad.push([1, 1, res.grad_details.id, i])
    res.grad.push([2, 1, res.grad_details.id, i])
    res.grad.push([3, 1, res.grad_details.id, i])
}

