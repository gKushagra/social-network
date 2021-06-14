const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 4051 });

wss.on('connection', function connection(ws) {

    console.log('client connected');

    // wss.clients.forEach(client => {
    //     console.log(client._id);
    //     if (ws["_id"] === client._id) {
    //         client.send(JSON.stringify({ type: "", msg: client._id }));
    //     }
    // });

    // send active users list every 5 seconds
    setInterval(() => {
        let activeUsers = [];

        wss.clients.forEach(function each(client) {
            activeUsers.push(client['_id']);
        });

        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: "active-users",
                    data: activeUsers
                }));
            }
        });
    }, 5000);

    // relay message
    ws.on('message', function incoming(data) {
        console.log('received: %s', JSON.parse(data));
        let message = JSON.parse(data);
        if ('type' in message && message['type'] === "authentication") {
            ws["_id"] = message.data;
            wss.clients.forEach(client => {
                console.log(client._id);
                if (client._id === message.data) {
                    client.send(JSON.stringify(message));
                }
            });
        } if ('type' in message &&
            (message['type'] === "call" ||
                message['type'] === "call-declined" ||
                message['type'] === "call-disconnected")) {
            console.log(message);
            wss.clients.forEach(client => {
                console.log(client._id);
                if (client._id === message.toPeerId) {
                    client.send(JSON.stringify(message));
                }
            });
        } else {
            wss.clients.forEach(client => {
                console.log(client._id);
                if (message.toUserId === client._id) {
                    client.send(JSON.stringify(message));
                }
            });
        }
    });

    // socket server error
    ws.on('error', function serverError(err) {
        wss.clients.forEach(client => {
            if (ws["_id"] === client._id) {
                client.close();
                wss.clients.delete(client);
            }
        });
        console.log('error, connection closed', err);
    });

    // close conn request from client
    ws.on('close', function connClose() {
        wss.clients.forEach(client => {
            if (ws["_id"] === client._id) {
                client.close();
                wss.clients.delete(client);
            }
        });
        console.log('connection closed');
    });
});