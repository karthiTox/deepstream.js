const ds = require("deepstream");
const { createVertex, matmul2d, transpose, vertex} = ds.core.transforms
const { logger } = ds.core.tools;
const { Readable } = require("stream");

// creating streams
const a = new vertex(new Readable({objectMode:true, read(){}}), {id:0, shape:[2, 2], step:[2, 1]});
const b = new vertex(new Readable({objectMode:true, read(){}}), {id:1, shape:[2, 2], step:[2, 1]});
new ds.core.transforms.add({}, {})
// operations
matmul2d(a, b).stream.pipe(logger("matrix mul:"))
transpose(a).stream.pipe(logger("transpose:"))

// [index, value, id, iteration]
// pushing value to the stream
a.stream.push([0, 1, 0, 0])
a.stream.push([1, 2, 0, 0])
a.stream.push([2, 3, 0, 0])
a.stream.push([3, 4, 0, 0])

b.stream.push([0, 1, 1, 0])
b.stream.push([1, 2, 1, 0])
b.stream.push([2, 3, 1, 0])
b.stream.push([3, 4, 1, 0])