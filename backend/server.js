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
client.query('CREATE TABLE IF NOT EXISTS "USER"(UID VARCHAR PRIMARY KEY,NAME VARCHAR,EMAIL VARCHAR)', (err, res) => {
    if(err){
        console.error(err);
        return;
    }
    // console.log(res)
})
client.query('CREATE TABLE IF NOT EXISTS "CHAT"(UID VARCHAR,MID VARCHAR PRIMARY KEY,TEXT VARCHAR,CREATED_AT DATE, FOREIGN KEY (UID) REFERENCES "USER"(UID))', (err, res) => {
    if(err){
        console.error(err);
        return;
    }
})
setInterval(()=>{
    let temp_msg=chat.pop();
    if(!temp_msg)
        return
    client.query(`INSERT INTO "CHAT" VALUES ('${temp_msg.uid}','${Date.now()}','${temp_msg.text}',NOW())`, (err, res) => {
        if(err){
            console.error(err);
            return;
        }
    })
},1000)
io.on("connection", socket => {

    numuser++;
    // console.log("Number of user: " + numuser);
    socket.emit("receive-chat-history", chat)

    // socket.emit("receive-chat",chat);

    socket.on("login", data => {
        console.log(data);
        authorisedUser[`${socket.id}`] = data;
        console.log(`[${chalk.green("+")}] [${data.name}]`)
        client.query(`INSERT INTO "USER" VALUES ('${data.uid}','${data.name}','${data.email}') ON CONFLICT (UID) DO NOTHING`, (err, res) => {
            if(err){
                console.error(err);
                return;
            }
        })
        client.query('SELECT * FROM "CHAT" ORDER BY MID DESC LIMIT 10', (err, res) => {
            if(err){
                console.error(err);
                return;
            }
            res.rows.slice().reverse()
                .forEach(function(ele) {
                    socket.emit("chat",ele)
                });
            // console.log(res.rows);
        })
    })
    socket.on("disconnect", reason => {
        if(!authorisedUser[`${socket.id}`])
            return
        console.log(`[${chalk.red("-")}] [${authorisedUser[`${socket.id}`].name}] ${reason}`)
    })
    socket.on("chat", data => {
        console.log(data)
        data.photoURL=authorisedUser[`${socket.id}`].photoURL
        socket.broadcast.emit('chat', data)
        console.log(`public > [${data.user}] ${data.text}`)
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