import * as _act from "./core/activations";
import { apply_act } from "./core/apply_act";
import { add, multiply, sub } from "./core/basic";
import { genRan, _inc_val } from "./core/gen";
import { logger } from "./core/log";
import { matmul2d, transpose } from "./core/mat";
import { _apply_fn } from "./core/transforms/_apply_fn";
import { _add, _change_val, _multiply, _sub } from "./core/transforms/_basic";
import { _mapper, _reducer, _transpose } from "./core/transforms/_mat";
import { createVertex, vertex } from "./core/vertex";
import { dense } from "./layers/dense";

module.exports = {
    core:{
        transforms:{
            add: _add,
            sub: _sub,
            multiply: _multiply,
            transpose: _transpose,
            mapper: _mapper,
            reduce: _reducer,
            apply_fn: _apply_fn,
            change_val: _change_val,
            inc_val: _inc_val,
        },
        operations:{
            vertex:vertex,            
            createVertex:createVertex,            
            add: add,
            sub: sub,
            multiply: multiply,
            transpose:transpose,
            matmul2d:matmul2d,
            genRan:genRan,
            apply_act:apply_act,
        },
        activations: _act,
        tools:{
            logger:logger         
        }
    },

    layers:{
        dense:dense,
    }
}