const express = require("express");
const socket = require("socket.io");
const open = require("open");
const { join } = require("path");

app = express();
let server;

let so;
let sock;

module.exports.start_board = function(){
    server = app.listen(4000, function(){
        console.log("Started dsboard at http://localhost:4000")
        open('http://localhost:4000');
    })
    app.use(express.static(join(__dirname, "/board")));
    so = socket(server);
    so.once("connection", t);
}

function t(s){
    sock = s;
}

module.exports.send = function(Id, obj){
    if(sock){
        console.log(obj)
        sock.emit(Id, obj)
    }
}
