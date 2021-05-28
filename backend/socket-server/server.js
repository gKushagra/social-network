const { v4: uuid } = require('uuid');
const WebSocket = require('ws');
const { Store } = require('./store');

const wss = new WebSocket.Server({ port: 4051 });

let users = new Store();

wss.on('connection', function connection(ws) {

    console.log('client connected');

    // assign uuid to connection
    // ws["_id"] = uuid();

    // wss.clients.forEach(client => {
    //     console.log(client._id);
    //     if (ws["_id"] === client._id) {
    //         client.send(JSON.stringify({ type: "", msg: client._id }));
    //     }
    // });

    // send active users list every 5 seconds
    setInterval(() => {
        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "active-users", data: users.activeUsers }));
            }
        });
    }, 5000);

    ws.on('message', function incoming(data) {
        console.log('received: %s', JSON.parse(data));
        let message = JSON.parse(data);
        console.log(message);
        switch (message.type) {
            case "authenticate":
                ws["_id"] = message.data.id;
                users.addActiveUser({ id: message.data.id, email: message.data.email });
                wss.clients.forEach(client => {
                    console.log(client._id);
                    if (ws["_id"] === client._id) {
                        client.send(JSON.stringify({ type: "", msg: client._id }));
                    }
                });
                break;
            case "msg-text":
                wss.clients.forEach(client => {
                    console.log(client._id);
                    if (message.data.peerId === client._id) {
                        client.send(JSON.stringify({
                            type: "msg-text",
                            text: message.data.text,
                            id: message.data.id,
                            peerId: message.data.peerId
                        }));
                    }
                });
                break;
            case "msg-image":

                break;
            case "msg-video":

                break;
            case "msg-link":

                break;
            case "msg-file":

                break;

            default:
                break;
        }

        // redirect to room
    });

    ws.on('error', function serverError(err) {
        wss.clients.forEach(client => {
            if (ws["_id"] === client._id) {
                users.removeActiveUser(client._id);
                client.close();
            }
        });
        console.log('error, connection closed', err);
    });

    ws.on('close', function connClose() {
        wss.clients.forEach(client => {
            if (ws["_id"] === client._id) {
                users.removeActiveUser(client._id);
                client.close();
            }
        });
        console.log('connection closed');
    });
});