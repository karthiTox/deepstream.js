// line by line parser

// let r = ''
// const changer = new Transform({
//     readableObjectMode:true,
// })

// changer._transform = (c, e, n) => {
//     r = c.toString();
//     let nindex  = r.indexOf("\n");
//     while(nindex > -1){
//         let line = r.substring(0, nindex);
//         r = r.substring(nindex+1);
//         changer.push(JSON.parse(line))
//         nindex = r.indexOf("\n")
//     }
//     n();
// }


// genarator

// _read = () => {
//     const r = read.push([t, 1, 0, i])
//     // console.log(r)
//     if(t == 1) i += 1;    
//     t = t == 0 ? 1 : 0;

//     if(i > 50) read.push(null);
// };