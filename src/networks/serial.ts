import { join } from "path";
import * as fs from "graceful-fs";

import { Readable, Transform } from "stream";
import { sub } from "../core/transforms/_basic";
import { changeId } from "../core/transforms/_transform_utils";
import { layer } from "../layers/layers";
import { logger } from "../core/transforms/log";


class Serial{

    private layers:layer[] = [];
    
    constructor() {
        
        process.once("beforeExit", ()=>{
            try {
                fs.rmdirSync(join(__dirname, "/temp_pool"), {recursive:true});
                console.log("temp_pool deleted")
            }catch{
                console.warn("temp_pool is not deleted")
            }
        })

    }

    add(layer:layer){
        this.layers.push(layer);
    } 
    
    public output:Readable|Transform|null = null;

    /**
     * build() method will pipe the streams together to do math operations
     * 
     * @param input Input stream to the model
     * @param output Output stream to the model
     */
    build(input:Readable|Transform, output:Readable|Transform){
        let in_line = input;
        let out_line = output;        
        
        for (let l = 0; l < this.layers.length; l++) {
            in_line = this.layers[l].feed(in_line);
        }

        this.output = in_line;
        out_line = this.compare(in_line, out_line);

        for (let l = this.layers.length - 1; l >= 0; l--) {
            out_line = this.layers[l].back(out_line);
        }

        out_line.pipe(logger("deleted", false))
    }

    predict(input:Readable|Transform){
        let in_line = input;        
        
        for (let l = 0; l < this.layers.length; l++) {
            in_line = this.layers[l].feed(in_line);
        }

        this.output = in_line;
    }
    
    private compare(result:Readable|Transform, output:Readable|Transform){        
        const op = sub(changeId(result, 0), 0, changeId(output, 1), 1);        
        return op;
    }
}

export function serial(){
    return new Serial();
}

