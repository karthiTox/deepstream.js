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
exports.add = exports.Adder = void 0;
var stream_1 = require("stream");
var _switcher_1 = require("./_switcher");
var Adder = /** @class */ (function (_super) {
    __extends(Adder, _super);
    function Adder() {
        var _this = _super.call(this, { objectMode: true, highWaterMark: 1 }) || this;
        _this.waitings = {};
        return _this;
    }
    Adder.prototype._transform = function (data, en, next) {
        var index = JSON.stringify(data.index) + JSON.stringify(data.iteration);
        if (index in this.waitings) {
            var res = this.waitings[index] + data.value;
            data.value = res;
            this.push(data);
            delete this.waitings[index];
        }
        else {
            this.waitings[index] = data.value;
        }
        next();
    };
    return Adder;
}(stream_1.Transform));
exports.Adder = Adder;
function add(a, aid, b, bid) {
    var adder = new Adder();
    var switched = _switcher_1.switcher(a, aid, b, bid);
    switched.pipe(adder);
    return adder;
}
exports.add = add;
