function sig(z:number) {
    return 1.0 / ( 1.0 + Math.exp(-z) )
}

function sigPrime(z:number){
    return (1.0 / ( 1.0 + Math.exp(-z) )) * (1 - (1.0 / ( 1.0 + Math.exp(-z) )))
}

function tanh(z:number){
    return (Math.exp(z) - Math.exp(-z)) / (Math.exp(z) + Math.exp(-z) )
}

function tanhPrime(z:number){
    return 1 - ((Math.exp(z) - Math.exp(-z)) / (Math.exp(z) + Math.exp(-z) ) * (Math.exp(z) - Math.exp(-z)) / (Math.exp(z) + Math.exp(-z) ))
}

function reLU(z:number){
    return Math.max(0, z)
}

function reLUprime(z:number){
    if(z > 0){
        return 1;
    }else{
        return 0;
    }
}

export type _activation = "sig" | "reLu" | "tanh";

export function getActivation(name:_activation){
    switch (name) {
        case "sig":
            return {
                fn:sig,
                delta:sigPrime
            }
        case "reLu":
            return {
                fn:reLU,
                delta:reLUprime
            }
        case "tanh":
            return {
                fn:tanh,
                delta:tanhPrime
            }
        default:
            return {
                fn:sig,
                delta:sigPrime
            }
    }
}