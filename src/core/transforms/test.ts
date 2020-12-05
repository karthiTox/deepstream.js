import { PassThrough, Readable, Transform } from "stream";
import { transpose, Transposer } from "./_mat";
import { data } from "./data.interface";
import { logger } from "./log";
import { matmul } from "./_mat";
import { reader } from "./_reader";
import { add, multiply, sub } from "./_basic";
import { changeId, Increment, increment, mulwith } from "./_transform_utils";
import { applyfn } from "./_apply_fn";
import { reLU, reLUprime, sig, sigPrime } from "../activations";
import { genRan, genVals } from "./_gen";

genVals(1, [2, 1], 4, 0).pipe(logger('a'))
