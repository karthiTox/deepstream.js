# DeepStream.js

<img src="logo.png" width="200" height="200" />

## What is this ? 

DeepStream.js is a Node-js package that provides you a power to train a large neural network.<br>The neural network is trained using Stream, Here the stream is not only used for importing the data but also used in the mathematical operations such as Matrix multiplication, Matrix addition and while applying activation function so the memory usage of this method is very low.
<!-- [graph] -->

## Stram Learning

DeepStream.js has a unique method to construct a neural network. the neural network is constructed using streams, Most framework out there are completely depends upon the RAM, so there is a limit for parameters of neural network but this pakage mostly utilized ROM ( Hard-disk/SSD ) to calculate the mathematical operation so there is no need to store every values in RAM and the large neural networks are possible

## Getting start

npm install deepstream.js

## Creating a model

```js
const ds = require("deepstream.js");
const {join} = require("path");

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
    
    inputs.push(
        ds.reader.json(join(__dirname, "/input.json"), [1, 2], iteration)
        // input.json
        // [1, 1]        
    );
    outputs.push(
        ds.reader.json(join(__dirname, "/output.json"), [1, 2], iteration)
        // output.json
        // [0, 0]
    );    
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
```