// server.js

const express = require('express');
const SocketServer = require('ws').Server;
const uuid = require('node-uuid');

// Set the port to 4000
const PORT = 8080;

// Create a new express server
const server = express()
   // Make the express server serve static assets (html, javascript, css) from the /public folder
  .use(express.static('public'))
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`));

// Create the WebSockets server
const wss = new SocketServer({ server });

// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.
var usersOnline = 0;

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if(client.readyState != client.OPEN) {
      console.log(`Client state is ${client.readyState}`);
    } else {
      client.send(data);
    }
  });
};

wss.on('connection', (ws) => {
  console.log('Client connected');
  usersOnline += 1;
  wss.broadcast(JSON.stringify({'type': 'usersOnline', 'usersOnline': usersOnline}));

  ws.on('message', function incoming(message) {
    message = JSON.parse(message);
    console.log(message);
    message.id = uuid.v1();
    switch(message.type) {
      case "postMessage":
        message.type = "incomingMessage"
        break;
      case "postNotification":
        message.type = "incomingNotification"
        break;
      default:
        throw new Error("Unknown event type " + message.type);
    }
    message = JSON.stringify(message);
    wss.broadcast(message);

  });

  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => {
    console.log('Client disconnected');
    usersOnline -= 1;
    wss.broadcast(JSON.stringify({'type': 'usersOnline', 'usersOnline': usersOnline}));

  });
});