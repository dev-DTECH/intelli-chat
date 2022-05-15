const {Server} = require("socket.io");
const chalk = require('chalk');
const {Client} = require('pg')
const connectionString = process.env.connectionURI
const PORT = process.env.PORT || 3000,
    express = require('express'),
    fs = require("fs"),
    app = require('express')(),
    http = require('http');


const server = http.createServer(app);
// const io = new Server(PORT);
const io = new Server(server);
let numuser = 0,
    chat = [],
    authorisedUser = [];
const client = new Client({
    connectionString
})
client.connect()
client.query('CREATE TABLE IF NOT EXISTS "USER"(uid VARCHAR PRIMARY KEY,NAME VARCHAR,EMAIL VARCHAR)', (err, res) => {
    if(err){
        console.error(err);
        return;
    }
    // console.log(res)
    client.end()
})
io.on("connection", socket => {

    numuser++;
    // console.log("Number of user: " + numuser);
    socket.emit("receive-chat-history", chat)

    // socket.emit("receive-chat",chat);

    socket.on("login", data => {
        console.log(data);
        authorisedUser[`${socket.id}`] = data;
        console.log(`[${chalk.green("+")}] [${data.name}]`)
    })
    socket.on("disconnect", reason => {
        console.log(`[${chalk.red("-")}] [${authorisedUser[`${socket.id}`].name}] ${reason}`)
    })
    socket.on("chat", data => {
        console.log(data)
        data.photoURL=authorisedUser[`${socket.id}`].photoURL
        socket.broadcast.emit('chat', data)
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
app.use(express.static('build'))

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/build/index.html');
});
server.listen(PORT, h => {
    console.log(h)
    console.log(`Server Online -> http://localhost:${PORT}`);
});