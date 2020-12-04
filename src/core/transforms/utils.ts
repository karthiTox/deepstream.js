export function _cstep(shape:number[]):number[]{   
    const res = [];
    for(let s = shape.length; s > 0; s--){
        if(!shape[s]) 
            res.unshift(1);
        else
            res.unshift(
                shape.slice(s).reduce((a, b) => a * b)
            );        
    }
    return res;    
}

export function _cstep_change(step:number[], dimension:number[]):number[]{    
    const res = [];
    for(let d = 0; d < dimension.length; d++){
        res[d] = step[dimension[d]]
    }
    return res;
}

export function _cindex(index:number[], step:number[]):number{
    let res = 0; 
    for(let i = 0; i < index.length; i++){        
        res += index[i] * step[i];
    }
    return res;
}

export function _findIndex(shape:number[], step:number[], index:number):number[]{    
    const _s = [];
    for(let s = 0; s < shape.length; s++){
        _s[s] = shape[s] * step[s]; 
        _s[s] = Math.floor((index%_s[s]) / step[s]);
    }
    
    return _s;
}