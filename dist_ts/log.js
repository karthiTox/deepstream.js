"use strict";
exports.__esModule = true;
exports.dataWriter = exports.logger = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
var stream_1 = require("stream");
function logger(msg, log, logAt) {
    if (log === void 0) { log = true; }
    var message = msg;
    return new stream_1.Writable({
        objectMode: true,
        write: function (data, en, next) {
            if (log) {
                if (logAt) {
                    if (data.index % logAt == 0)
                        console.log(message, data.index);
                }
                else
                    console.log(message, data.index);
            }
            next();
        }
    });
}
exports.logger = logger;
exports.dataWriter = new /** @class */ (function () {
    function class_1() {
        this.file = fs_1.createWriteStream(path_1.join(__dirname, "/log.txt"));
    }
    class_1.prototype.write = function (s) {
        this.file.write(s + "\n");
    };
    return class_1;
}());
