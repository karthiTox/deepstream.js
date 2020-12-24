const ds = require("deepstream.js");
const {join} = require("path")

const model = ds.networks.serial({
    log_loss:false,
    log_loss_at:1,
    loss:"CrossEntropy costfn",
    optimizer:"sgd"
});

model.add(ds.layers.dense({
    prev_neurons:2,
    neurons:2,
    activation:"sig",
    learningRate:0.04
}))

model.add(ds.layers.dense({
    prev_neurons:2,
    neurons:2,
    activation:"sig",
    learningRate:0.04
}))


let inputs = [];
let outputs = [];

for(let iteration = 0; iteration < 10; iteration++){
    inputs.push(ds.reader.json(join(__dirname, "/input.json"), [1, 2], iteration));
    outputs.push(ds.reader.json(join(__dirname, "/output.json"), [1, 2], iteration));
}

model.train( inputs, outputs );

model.outline.pipe(ds.logger.logfn((data)=>{
    console.log(
                "iteration:",data.iteration,
                "index:",data.index, 
                "value:",data.value, 
                "Memory Usage:",ds.logger.formatMemory(process.memoryUsage().heapUsed),"MB"
            )
}))