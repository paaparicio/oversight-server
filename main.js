const WebSocket = require('ws');
const https = require('https');

const Rooms = require('./Server/Classes/Channels');

const server = https.createServer();
const wss = new WebSocket.Server({ server });

const channels = new Rooms();

console.log('Server is start');

wss.on('connection', function connection(ws, req) {
    ws.header = splitDataByURL(req.url);
    ws.header.id = channels.generateID();

    console.log('Server - OnOpen', "user: "+ ws.header.id);

    channels.connectUser(ws);

    ws.on('message', function incoming(data) {
        console.log('Server - OnMessage', "user: "+ ws.header.id);
        console.log(channels.CHANNELS_ARRAY);

        channels.sendMessageChannel(ws.header, data)
    });

    ws.on('close', () => {
        channels.disconnectUser(ws);

        console.log('Server - OnClose', "user: "+ ws.header.id);
        console.log(channels.CHANNELS_ARRAY);
    });
});

server.listen(process.env.PORT || 8080);

function splitDataByURL(data) {
    let header = {};
    let url = data.substring(2);
    let separateByDatas = url.split('&');

    separateByDatas.forEach(data => {
        let separateByKeys = data.split("=");

        separateByKeys.forEach((key, i) => {
            !(i % 2) && (header[key] = separateByKeys[i + 1]);
        })
    })

    return header;
}
