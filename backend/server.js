const {Server} = require("socket.io");
const chalk = require('chalk');

const PORT = process.env.PORT || 3000,
    express = require('express'),
    fs = require("fs"),
    app = require('express')(),
    http = require('http');
const server = http.createServer(app);
// const io = new Server(PORT);
const io = new Server(server);
app.use(express.static('build'))

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/build/index.html');
});

let numuser = 0,
    chat = [];

io.on("connection", socket => {

    numuser++;
    // console.log("Number of user: " + numuser);
    socket.emit("receive-chat-history", chat)

    // socket.emit("receive-chat",chat);

    socket.on("login", data => {
        console.log(data);
        console.log(`[${chalk.green("+")}] [${data.name}]`)
    })
    socket.on("disconnect", reason => {
        console.log(`[${chalk.red("-")}] [${"data.name"}] ${reason}`)
    })
    socket.on("message", data => {
        console.log(data)

        socket.broadcast.emit('message',data)
        console.log(`public > [${data.user}] ${data.message}`)
        chat.push(data)
        // console.log(chat)
    })
    socket.on("send-file", data => {
        socket.broadcast.emit('receive-chat', data)
        chat.push(data)
        // console.log(chat)
    })
    socket.on("send-video-stream", data => {
        socket.broadcast.emit('receive-video-stream', data)
        // chat.push(data)
        // console.log(chat)
    })


    // var uploader = new siofu();
    // uploader.dir = "./public/uploads/";
    // uploader.listen(socket);
    //
    // socket.on("disconnect", () => {
    //     // console.log("user disconnected");
    //     numuser--;
    //     console.log("Number of user: " + numuser);
    // });
});
server.listen(PORT, h => {
    console.log(h)
    console.log(`Server Online -> http://localhost:${PORT}`);
});