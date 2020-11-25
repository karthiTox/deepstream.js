export function sig(z:number) {
    return 1.0 / ( 1.0 + Math.exp(-z) )
}

export function sigPrime(z:number){
    return (1.0 / ( 1.0 + Math.exp(-z) )) * (1 - (1.0 / ( 1.0 + Math.exp(-z) )))
}

export function tanh(z:number){
    return (Math.exp(z) - Math.exp(-z)) / (Math.exp(z) + Math.exp(-z) )
}

export function tanhPrime(z:number){
    return 1 - ((Math.exp(z) - Math.exp(-z)) / (Math.exp(z) + Math.exp(-z) ) * (Math.exp(z) - Math.exp(-z)) / (Math.exp(z) + Math.exp(-z) ))
}

export function reLU(z:number){
    return Math.max(0, z)
}

export function reLUprime(z:number){
    if(z > 0){
        return 1;
    }else{
        return 0;
    }
}