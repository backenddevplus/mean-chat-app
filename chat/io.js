const socketIo = require('socket.io');
const Message = require('../models/message');

const users = [];
const connections = [];

const initialize = (server) => {
  const io = socketIo(server);

  io.on("connection", (socket) => {
    connections.push(socket);

    socket.emit("welcome", {
      msg: "Welcome to the chat server!"
    });

    socket.on("username", (data) => {
      if (data.username) {
        socket.username = data.username;
        if (users.indexOf(socket.username) < 0) {
          users.push(socket.username);
        }
        io.emit("active", users);
        console.log("[%s] connected", socket.username);
        console.log("<users>:", users);
      }
    });

    socket.on("getactive", () => {
      socket.emit("active", users);
    });

    socket.on("message", (data) => {
      socket.broadcast.emit("message", data);
      console.log("[%s]<< %s", data.from, data.text);

      // save the message to the database
      let message = new Message(data);
      Message.addMessage(message, (err, newMsg) => {});
    });

    socket.on("disconnect", () => {
      if (users.indexOf(socket.username) > -1) {
        let multiple = checkMultiple(socket.username);
        if (multiple == 1) {
          users.splice(users.indexOf(socket.username), 1);
          console.log("[%s] disconnected", socket.username);
          console.log("<users>:", users);
        }
      }
      connections.splice(connections.indexOf(socket), 1);
      io.emit("active", users);
    });
  });
};

const checkMultiple = (username) => {
  let multiple = 0;
  for (conn of connections) {
    if (conn.username == username) {
      multiple ++;
    }
  }
  return multiple;
};

module.exports = initialize;
