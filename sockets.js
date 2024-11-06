const { uuid } = require('uuidv4');
// const { app } = require('./index')

let Rooms = [];
let Users = [];

const initSocket = (io) => {
  io.on("connection", (socket) => {
    //console.log("user connected => ", socket.id);
    // console.log("Users => ", Users);

    // Add user to the list
    Users.push({ id: socket.id });
    //console.log(`Users => ${JSON.stringify(Users)}`)
    // socket.emit("room_list", Rooms);

    // Return the rooms list every 2s
    setInterval(() => {
      socket.emit("room_list", Rooms);
    }, 1500);

    socket.on("createRoom", ({ room, socket_cred }) => {
      // Add name to the user
      //console.log(socket_cred)
      const userIdx = Users.findIndex((e) => e.id === socket.id);
      Users[userIdx].name = socket_cred.name;
      Users[userIdx].room = room;

      io.to(room).emit("joinRoom");
      const room_uuid = uuid()
      Rooms.push({ room, id: room_uuid });
      console.log(JSON.stringify(Rooms))

      socket.emit("room_list", Rooms);
    });

    socket.on("joinRoom", ({ room, socket_cred }) => {
      //console.log(`socket_cred in joinRoom => ${JSON.stringify(socket_cred)}`)
      const userIdx = Users.findIndex((e) => e.id === socket.id);
      if (userIdx === -1) {
        Users.push({ id: socket.id, name: socket_cred.name, room });
      } else {
        Users[userIdx].name = socket_cred.name;
        Users[userIdx].room = room;
      }
      socket.join(room);
      io.to(room).emit("newSocketList", Users);
      console.log(`Rooms ${JSON.stringify(Rooms)}`)
      socket.emit("room_list", Rooms);
    });

    socket.on("leaveRoom", ({ room, socket_cred }) => {
      const userIdx = Users.findIndex((e) => e.id === socket.id)
      for (let i = 0; i < Users.length; i++) {
        if (userIdx !== -1) {
          Users.splice(1, userIdx)
        }
      }
      console.log(`exit room => ${room}`)
      console.log(`Room => ${Rooms}`)
      console.log(`socket_cred => ${socket_cred}`)
    })

    socket.on("dibujandoSocket", (data) => {
      //console.log(`dibujandoSocket ${JSON.stringify(data)}`)
      io.to(data.room).emit("dibujandoSocket", data);
    });

    // socket.on("changeColor", (data) => {
    //   io.to(data.room_id).emit("changeColor", data);
    // });

    socket.on("borrando", (data) => {
      io.to(data.room).emit("borrando", data);
    });

    socket.on("disconnect", (data) => {
      console.log(`data on disconnect => ${data}`)
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
    });
  });
}
module.exports = { initSocket, Users, Rooms };
