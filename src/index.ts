import { dense } from "./layers/dense";
import { serial } from "./networks/serial";
import { AllowOnly, formatMemory, log, logfn } from "./core/transforms/log";
import { genRan, GenValsNormal } from "./core/transforms/_gen";
import { reader } from "./core/transforms/_reader";

module.exports = {
    layers:{
        dense: dense,
    },

    networks:{
        serial: serial
    },

    logger:{
        log:log,
        logfn:logfn,
        AllowOnly:AllowOnly,
        formatMemory:formatMemory,
    },

    generator:{
        rand:genRan,
        val:GenValsNormal,
    },
    
    reader:{
        json:reader
    },
}