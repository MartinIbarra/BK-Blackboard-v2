const express = require("express");
const { Server } = require("socket.io");
const app = express();
const server = require("http").createServer(app);
require("dotenv").config();

// const process = require("process");
// const io = require("socket.io")(server);
// console.log("process.env.FRONT_ENDPOINT => ", process.env.PORT);
const io = new Server(server, {
	cors: {
		origin: process.env.FRONT_ENDPOINT || "http://localhost:5173",
	},
});
// const authRoutes = require("./routes/routes");

// const { getUser, createRoom, getRooms } = require("./db/index");

const { v4: uuidv4 } = require("uuid");

const cors = require("cors");
const cookieParser = require("cookie-parser");
const corsOptions = {
	origin: process.env.FRONT_ENDPOINT || "http://localhost:5173",
	credentials: true,
	optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
// app.use(authRoutes);

app.set("port", process.env.PORT || 5000);

// const Room = require("./models/Room");
// const { addUser, getUser, removeUser } = require("./helpers/userHelper");
// const { createRoom } = require("./helpers/roomHelper");

app.get("/set-cookie", (req, res) => {
	res.cookie("isAuthenticated", true, {
		httpOnly: true,
		maxAge: 24 * 60 * 60 * 1000,
	});
	res.send("cookies are set");
});

app.get("/get-cookie", (req, res) => {
	const cookies = req.cookies;
	// console.log(cookies)
	res.json(cookies);
});

app.get("/protected", (req, res) => {});

app.get("/test", (req, res) => {
	res.status(200).send("OK");
});

let Rooms = [];
let Users = [];

io.on("connection", (socket) => {
	// console.log("user connected => ", socket.id);

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
		Rooms.push({ room, id: uuidv4() });

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
		io.to(room).emit("newSocketList", [...Users]);

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

server.listen(app.get("port"), () => console.log(`server listening on port ${app.get("port")}`));
