import { PassThrough, Readable, Transform, Writable } from "stream";
import * as fs from "fs";
import { transpose, Transposer } from "./_mat";
import { data } from "./data.interface";
import { AllowAt, create_writer, formatMemory, logger } from "./log";
import { matmul } from "./_mat";
import { reader } from "./_reader";
import { add, multiply, sub } from "./_basic";
import { changeId, Increment, increment, LineStringify, mulwith } from "./_transform_utils";
import { applyfn } from "./_apply_fn";
import { reLU, reLUprime, sig, sigPrime } from "../activations";
import { genRan, genVals } from "./_gen";
import { Memory, OneShotMemory } from "./_memory";
import { join } from "path";
import * as os from "os";
import { Switcher, switcher } from "./_switcher";

function feed(a:Readable|Transform, w:Readable|Transform, b:Readable|Transform){    
    const wt = transpose(w);
    
    const mat = matmul(
        a, 0,
        w, 1
    );

    const added = add(
        changeId(mat, 0), 0, 
        changeId(b, 1), 1
    )

    return applyfn(added, sig);
}

const a = genVals([1], [2, 2], 5, 0)
const w = genVals([1], [2, 2], 5, 1)
const b = genVals([1], [2, 2], 5, 1)

feed(a, w, b).pipe(logger("res"))