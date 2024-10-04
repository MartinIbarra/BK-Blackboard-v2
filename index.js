const express = require("express");
const { Server } = require("socket.io");
const app = express();
const path = require("path");
const server = require("http").createServer(app);
const dotenv = require("dotenv");
dotenv.config({ path: [".env.development", ".env.production"] });
const oauthRoutes = require("./routes/oauth");
const requestRoutes = require("./routes/oauth/request");
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
const { OAuth2Client } = require("google-auth-library");
const corsOptions = {
	origin: process.env.FRONT_ENDPOINT || "http://localhost:5173",
	credentials: true,
	optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.get("/", async (req, res) => {
	const code = req.query.code;
	console.log("code => ", code);

	const getUserData = async (access_token) => {
		const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);
		const data = await response.json();
		console.log(data);
		return data;
	};

	try {
		const redirectUrl = "http://localhost:5000";
		const oAuth2Client = new OAuth2Client(process.env.CLIENT_ID, process.env.CLIENT_SECRET, redirectUrl);
		const response = await oAuth2Client.getToken(code);
		await oAuth2Client.setCredentials(response.tokens);
		console.log("Token Acquired => ", response.tokens);
		const credentials = oAuth2Client.credentials;
		// console.log("credentials => ", user);
		const user = await getUserData(credentials.access_token);
		res.cookie("user", { name: user.name, family_name: user.family_name, picture: user.picture, id_token: credentials.id_token }, { maxAge: credentials.expiry_date });
		res.send("<script>window.close()</script>");
	} catch (err) {
		console.log("Error with Google SSO: ", err);
	}
});

// app.use(authRoutes);
app.use("/oauth", oauthRoutes);
app.use("/request", requestRoutes);

app.set("port", process.env.PORT || 5000);

// const Room = require("./models/Room");
// const { addUser, getUser, removeUser } = require("./helpers/userHelper");
// const { createRoom } = require("./helpers/roomHelper");

app.get("/set-cookie", (req, res) => {
	console.log(req.body);
	res.send(req.body);
	// res.cookie("isAuthenticated", true, {
	// 	httpOnly: true,
	// 	maxAge: 24 * 60 * 60 * 1000,
	// });
	// res.cookie("userInfoSSO",`name: ${}`, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 } )
	// res.send("<script>window.close()</script>");
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
