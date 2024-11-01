const { uuid } = require('uuidv4');
// const { app } = require('./index')

let Rooms = [];
let Users = [];

const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("user connected => ", socket.id);
    // console.log("Users => ", Users);

    // Add user to the list
    Users.push({ id: socket.id });

    socket.emit("room_list", Rooms);

    // Return the rooms list every 2s
    setInterval(() => {
      socket.emit("room_list", Rooms);
    }, 2000);

    socket.on("createRoom", ({ room, socket_name }) => {
      // console.log("==== room created ====", room);
      // console.log("==== user created ====", socket_name);

      // Add name to the user
      const userIdx = Users.findIndex((e) => e.id === socket.id);
      Users[userIdx].name = socket_name;
      Users[userIdx].room = room;

      io.to(room).emit("joinRoom");
      const room_uuid = uuid()
      Rooms.push({ room, id: room_uuid });

      socket.emit("room_list", Rooms);

      // console.log("Users => ", Users);
      // console.log("Rooms => ", Rooms);
    });

    socket.on("joinRoom", ({ room, socket_name }) => {
      const userIdx = Users.findIndex((e) => e.id === socket.id);
      if (userIdx === -1) {
        Users.push({ id: socket.id, name: socket_name, room });
      } else {
        Users[userIdx].name = socket_name;
        Users[userIdx].room = room;
      }

      socket.join(room);
      io.to(room).emit("newSocketList", Users);

      socket.emit("room_list", Rooms);

      // io.to(room).emit("joinRoom");
      // console.log("Users join => ", Users);
      // console.log("Rooms join => ", Rooms);
      // console.log(`socket ${socket.id} has joined room ${room}`);
    });

    socket.on("dibujandoSocket", (data) => {
      io.to(data.room).emit("dibujandoSocket", data);
    });

    // socket.on("changeColor", (data) => {
    //   io.to(data.room_id).emit("changeColor", data);
    // });

    socket.on("borrando", (data) => {
      io.to(data.room).emit("borrando", data);
    });

    socket.on("disconnect", (data) => {
      Users = Users.filter((e) => e.id !== socket.id); // Delete the user

      if (Users.length === 0) {
        Rooms = []; // If there's no users, delete every room
      } else {
        //If the room has no users, just delete the empty room
        for (let i = 0; i < Rooms.length; i++) {
          const idx = Users.findIndex((user) => user.room === Rooms[i].room);
          if (idx === -1) {
            Rooms.splice(i, 1);
          }
        }
      }

      socket.emit("room_list", Rooms);

      // console.log("Users onDelete => ", Users);
      // console.log("Rooms onDelete => ", Rooms);

      // console.log("disconnected => ", data);
    });
  });

}
module.exports = { initSocket, Users, Rooms };
