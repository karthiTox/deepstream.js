const ds = require("deepsteam.js");
const {createVertex, add, sub, multiply} = ds.core.operations
const {logger} = ds.core.tools;
const { Readable } = require("stream");

// creating streams
const a = createVertex(new Readable({objectMode:true, read(){}}), [1, 2], 0);
const b = createVertex(new Readable({objectMode:true, read(){}}), [1, 2], 1);

// operations
add(a, b).stream.pipe(logger("addition:"))
multiply(a, b).stream.pipe(logger("multiply:"))

// [index, value, id, iteration]
// pushing value to the stream
a.stream.push([0, 1, 0, 0])
a.stream.push([1, 10, 0, 1])

b.stream.push([0, 1, 1, 0])
b.stream.push([1, 1, 1, 1])