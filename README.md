# DeepStream.js

<img src="logo.png" width="200" height="200" />

## What is this ?
Train your neural network using streams,<br> this project is implemented using Node.js and the main goal of this project is to make it easier to train large neural networks

## Installation

### npm

```bash
npm install deepsteam.js --save
```
### Node

```js
Node
const ds = require('deepsteam.js');

const transforms = ds.core.transforms;
const ops = ds.core.operations;

const activations = ds.core.activations:
const layers = ds.layers
```

## What is Stream?
According to wikipedia, stream is a sequence of data elements made available over time. A stream can be thought of as items on a conveyor belt being processed one at a time rather than in large batches.

We assume you have little experience in [Stream](https://nodejs.org/api/stream.html) (Node.js), If you haven't read through docs, take a look at those first and them continue reading this, it will help you to understand easily while reading this docs.

### Intro
ds.core.transforms contains math operation tranform, this is used performed math ops on streams<br>
you can import transforms using 'ds.core.transforms'.

```js
const ds = require("deepstream");
const transforms = ds.core.transforms
```

### input order
inputs of stream should follow certain order so that algorithm can identify what to do with the chunk. input should be passed as array, there is no need to convert to string. At first index of array is used to store the index of the matrix.

```js
[index, value, Id, iteration]
[0, 1, 54, 0]
```

2x2 matrix<br>
[[10, 11],<br>
 [12, 13]]<br>

this can be represented using 1D vector,<br>

value: [10, 11, 12, 13]<br>
shape: [2, 2]<br>

you have to follow the index of the 1D vector while passing the array to the stream<br><br>
for example<br>

2x2 matrix<br>
[[10, 11],<br>
 [12, 13]]<br>

this matrix can be passed as
[0, 10, 54, 0]
[1, 11, 54, 0]
[2, 12, 54, 0]
[3, 13, 54, 0]

### Basic math operations
__add__ is a transform so it can be piped to Readable stream, it is used to add the values that is streamed through this transform.<br>
if you pass [0, 10, 54, 0], it will store the value and it will wait for the next value which has the same index '0' and then if you pass [0, 11, 54, 0], it will perform the addition operation and then push the result as [0, 21, 65, 0]. 

this same method is followed for sub and multiplication.

```js
// importing the required pakages
const ds = require("deepstream");
const {add, sub, multiply } = ds.core.transforms

const { Readable } = require("stream");
const {logger} = ds.core.tools;

// creating streams
const a = new Readable({objectMode:true, read(){}})
const b = new Readable({objectMode:true, read(){}})

// operation 
const details = {id:0, shape:[2, 1], step:[2, 1]}
const adder = new add({/*Transform options*/ObjectMode:true}, details)
a.pipe(adder);
b.pipe(adder);

adder.pipe(logger("addition:"))

// [index, value, id, iteration]
// pushing value to the stream
a.stream.push([0, 1, 0, 0])
a.stream.push([1, 10, 0, 1])

b.stream.push([0, 1, 1, 0])
b.stream.push([1, 1, 1, 1])
```
### Matrix math operations

#### transpose
__transpose__ is a transform so it can be piped to Readable stream, it is used to tranpose the axis of the chunk streamed through this transform.<br>

```js
// here we are creating stream using vertex so that we can perform auto grad using streams

// creating streams
const a = new vertex(new Readable({objectMode:true, read(){}}), {id:0, shape:[2, 2], step:[2, 1]});
const b = new vertex(new Readable({objectMode:true, read(){}}), {id:1, shape:[2, 2], step:[2, 1]});

// operation
transpose(a).stream.pipe(logger("transpose:"))

// [index, value, id, iteration]
// pushing value to the stream
a.stream.push([0, 1, 0, 0])
a.stream.push([1, 2, 0, 0])
a.stream.push([2, 3, 0, 0])
a.stream.push([3, 4, 0, 0])
```