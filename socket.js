const WebSocket = require('ws');
const app = require('express')();
const server = require('http').Server(app);
const wss = new WebSocket.Server({server});

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

console.log('start');

wss.on('connection', function connection(ws) {
    console.log('open');

    ws.on('close', () => console.log('close'))
})

server.listen(process.env.PORT || 8080);
