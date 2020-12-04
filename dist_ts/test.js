"use strict";
// import { Transform, TransformCallback } from "stream";
exports.__esModule = true;
var stream_1 = require("stream");
var log_1 = require("./log");
var _basic_1 = require("./_basic");
// class Reader extends Transform{
//     _transform(text:string, en:BufferEncoding, next:TransformCallback){
//     }
// }
var a = new stream_1.Readable({ objectMode: true, read: function () { } });
var b = new stream_1.Readable({ objectMode: true, read: function () { } });
_basic_1.add(a, 0, b, 1).pipe(log_1.logger("test", true));
for (var i = 0; i < 10; i++) {
    a.push({
        id: 0,
        index: i,
        iteration: i,
        value: Math.random(),
        shape: [2, 2]
    });
    a.push({
        id: 0,
        index: i + 10,
        iteration: i,
        value: Math.random(),
        shape: [2, 2]
    });
    b.push({
        id: 1,
        index: i,
        iteration: i,
        value: 1,
        shape: [2, 2]
    });
    b.push({
        id: 1,
        index: i + 10,
        iteration: i,
        value: Math.random(),
        shape: [2, 2]
    });
}
