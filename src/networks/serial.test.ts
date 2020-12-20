import { dense } from "../layers/dense";
import { serial } from "./serial";
import { genValues } from "../core/transforms/_gen";
import { logger } from "../core/transforms/log";

const model = serial();

model.add(dense({
    prev_neurons:4,
    neurons:4,
    activation:"sig",
    learningRate:0.04
}))

model.add(dense({
    prev_neurons:4,
    neurons:4,
    activation:"sig",
    learningRate:0.04
}))

const input = genValues([1], [1, 4], 2);
const output = genValues([1], [1, 4], 2);

model.build(input, output);

model.output?.pipe(logger("test"));












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