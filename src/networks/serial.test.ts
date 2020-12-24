import { dense } from "../layers/dense";
import { serial } from "./serial";
import { genRan, GenValsNormal, genValues } from "../core/transforms/_gen";
import { logDetail, log, formatMemory, AllowOnly, logfn} from "../core/transforms/log";
import { reader } from "../core/transforms/_reader";
import { join } from "path";

// const model = serial({
//     log_loss:false,
//     log_loss_at:1,
//     loss:"CrossEntropy costfn",
//     optimizer:"sgd"
// });

// model.add(dense({
//     prev_neurons:2,
//     neurons:2,
//     activation:"sig",
//     learningRate:0.04
// }))

// model.add(dense({
//     prev_neurons:2,
//     neurons:2,
//     activation:"sig",
//     learningRate:0.04
// }))


// let inputs = [];
// let outputs = [];

// for (let index = 0; index < 1000; index++) {
//     inputs.push(GenValsNormal([1], [1, 2], index));
//     outputs.push(GenValsNormal([0,  1], [1, 2], index));
// }

// model.train( inputs, outputs );

// model.outline.pipe(AllowOnly("iteration", 10)).pipe(logfn((data)=>{
//     console.log(
//                 "iteration:",data.iteration,
//                 "index:",data.index, 
//                 "value:",data.value, 
//                 "Memory Usage:",formatMemory(process.memoryUsage().heapUsed),"MB"
//             )
// }));












// const a = reader(join(__dirname, "/ia.json"), [1, 5]);
// const output = reader(join(__dirname, "/ioutput.json"), [1, 2]);

// const t = 2;
// const i = 1;
// const a = genVals([1], [t, t], i);
// const output = genVals([1], [t, t], i);

// const dense = new Dense();
// const result = dense.feed(a)
// const err = dense.compare(result, output);
// dense.back(err).pipe(logger("Res", false));

// result.pipe(AllowAt("index", 100)).pipe(logger("result", true, 100));