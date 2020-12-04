"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.switcher = exports.Switcher = void 0;
var stream_1 = require("stream");
var Switcher = /** @class */ (function (_super) {
    __extends(Switcher, _super);
    function Switcher(FirstStream, fid, SecondStream, sid) {
        var _this = _super.call(this, { objectMode: true, highWaterMark: 1 }) || this;
        _this.FirstStream = FirstStream;
        _this.fid = fid;
        _this.SecondStream = SecondStream;
        _this.sid = sid;
        return _this;
    }
    Switcher.prototype._transform = function (data, en, next) {
        if (data.id == this.fid) {
            this.FirstStream.pause();
            this.SecondStream.resume();
        }
        else if (data.id == this.sid) {
            this.SecondStream.pause();
            this.FirstStream.resume();
        }
        else {
            this.FirstStream.resume();
            this.SecondStream.resume();
        }
        this.push(data);
        next();
    };
    return Switcher;
}(stream_1.Transform));
exports.Switcher = Switcher;
function switcher(a, aid, b, bid) {
    var switcher = new Switcher(a, aid, b, bid);
    a.pipe(switcher, { end: false });
    b.pipe(switcher, { end: false });
    return switcher;
}
exports.switcher = switcher;
