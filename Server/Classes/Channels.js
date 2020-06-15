const shortid = require('shortid');

module.exports = class Channels {
    constructor() {
        this.CHANNEL_USER = {};
        this.CHANNEL_NAME = "";
        this.MAX_USERS = 2;

        this.CHANNELS_ARRAY = [{name: "", users: [], connected: 0}];

        this.ERROR_MESSAGES = {
            session_full: "This game is actually used by another player.",
            session_exist: "Your session doesn't exist.",
            game_disconnect: "The game is disconnected."
        };
    }

    setVariablesUser(client) {
        this.CHANNEL_USER = client;
        this.CHANNEL_USER.id = client.header.id;
        this.CHANNEL_NAME = client.header.channel;
        this.CHANNEL_DEVICE = client.header.device;
        this.CHANEL_MULTIDEVICE = false;
    }

    generateID() {
        return Math.floor(Math.random() * 1000);
    }

    isChannelExist(name) {
        return this.CHANNELS_ARRAY.some(channel => channel.name === name);
    }
    isChannelIsFull(name) {
       const filter =  this.CHANNELS_ARRAY.filter(channel => channel.name === name);
       return filter[0].connected < this.MAX_USERS;
    }

    createUsersChannel() {
       this.CHANNELS_ARRAY.push({
           name: this.CHANNEL_NAME,
           users: [this.CHANNEL_USER],
           connected: 1
       });
    }
    addUserToChannel() {

        if(this.isChannelExist(this.CHANNEL_NAME)) {
            if(this.isChannelIsFull(this.CHANNEL_NAME)) {
                this.CHANNELS_ARRAY.forEach(channel => {
                    if(channel.name === this.CHANNEL_NAME) {
                        channel.users.push(this.CHANNEL_USER);
                        channel.connected = channel.users.length;

                        this.CHANEL_MULTIDEVICE = true;
                        channel.users[0].send(JSON.stringify({type: "ROOM", value: this.CHANNEL_NAME, multidevice: this.CHANEL_MULTIDEVICE}));
                        channel.users[1].send(JSON.stringify({type: "ROOM", value: this.CHANNEL_NAME, multidevice: this.CHANEL_MULTIDEVICE}));
                    }
                });
            } else {
                this.CHANNEL_USER.send(JSON.stringify({type: "error", data: this.ERROR_MESSAGES.session_full}));
                this.CHANNEL_USER.close();
            }
        } else {
            this.CHANNEL_USER.send(JSON.stringify({type: "error", data: this.ERROR_MESSAGES.session_exist}));
            this.CHANNEL_USER.close();
        }
    }

    sendMessageChannel(client, message) {
        let filter = this.CHANNELS_ARRAY.filter(channel => channel.name === client.channel);

        filter.forEach(channel => {
            channel.users.forEach(user => user.send(message))
        })
    }

    connectUser(client) {
        this.setVariablesUser(client);

        if(this.CHANNEL_DEVICE === "UNITY") {
            let name = shortid.generate();

            client.header.channel = name;

            this.CHANNEL_USER.send(JSON.stringify({type: "ROOM", value: name, multidevice: this.CHANEL_MULTIDEVICE}));

            this.setVariablesUser(client);
            this.createUsersChannel();
        } else {
            this.addUserToChannel();
        }

        console.log(this.CHANNELS_ARRAY)
    }

    disconnectUser(client) {
        this.setVariablesUser(client);

        this.CHANNELS_ARRAY.forEach((channel, x) => {
            if(channel.connected > 0) {
                channel.users.forEach((user, y) => {
                    if(user.id === this.CHANNEL_USER.id) {
                        this.CHANNELS_ARRAY[x]['users'].splice(y, 1);
                    }
                });

                if(this.CHANNEL_DEVICE === "UNITY") {
                    if(channel.name === this.CHANNEL_NAME) {
                        channel.users.forEach(user => {
                            user.send(JSON.stringify({type: "error", data: this.ERROR_MESSAGES.game_disconnect}));
                            user.close()
                        });
                    }
                }
            }

            channel.connected = channel.users.length;
            (channel.name !== "" && channel.connected === 0) && this.CHANNELS_ARRAY.splice(x, 1);
        });
    }
};
