const express = require('express');
const { WebSocket, WebSocketServer } = require("ws");
const cors = require('cors');
const app = express();

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

function generateRandomNumber() {
    const min = 1000;
    const max = 65536;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
const users = [
    { id: makeid(5), name: "bob", lang: "he" },
    { id: makeid(5), name: "alice", lang: "he" },
    { id: makeid(5), name: "yishai", lang: "he" },
    { id: makeid(5), name: "yair", lang: "en" },
    { id: makeid(5), name: "saleh", lang: "ar" },
    { id: makeid(5), name: "dania", lang: "ar" },
    { id: makeid(5), name: "muhammad", lang: "ar" }
];

app.use(cors());

app.use(express.json());

const sockets = {}; // connection: user1ID_user2ID: {ws,port}
const ports = [];
app.get('/users', (req, res) => {
    res.json({ users }).end();
});

app.post('/startChat', (req, res) => {
    const { currentUserId, reciverUserId } = req.body;
    const sorted = [currentUserId, reciverUserId].sort();
    const usersKeys = `${sorted[0]}_${sorted[1]}`;
    if (!(usersKeys in sockets)) {
        let port = generateRandomNumber();
        while (ports.includes(port)) {
            port = generateRandomNumber();
        }
        ports.push(port);
        const wsServer = new WebSocketServer({ port });
        wsServer.on("connection", (ws) => {
            ws.send(JSON.stringify({ type: 'connection', msg: `user connected to port num: ${port}`, }));
            ws.on("message", (data) => {
                const msg = data.toString();
                wsServer.clients.forEach(function each(client) {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ msg }));
                    }
                });
            });
            ws.on("close", () => {
                console.log(" User Disconnected ");
            });
            ws.onerror = function () {
                console.log("Some Error ocurred ");
            };
        });
        sockets[usersKeys] = { ws: wsServer, port, currentlyConnected: [] };
    }
    res.json({ port: sockets[usersKeys].port }).end();
    return;
});


app.listen(5321, () => {
    console.log('listening');
});