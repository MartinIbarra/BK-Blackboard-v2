const express = require("express");
const { Server } = require("socket.io");
const app = express();
const server = require("http").createServer(app);
const dotenv = require("dotenv");
dotenv.config({ path: [".env.development", ".env.production"] });

const { initSocket, Users, Rooms } = require('./sockets');

const io = new Server(server, {
  cors: {
    origin: process.env.FRONT_ENDPOINT || "http://localhost:5173",
  },
});

// Socket logic goes here
initSocket(io);

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
app.use(express.urlencoded({ extended: true }));

app.set("port", process.env.PORT || 5000);

// app.get("/protected", (req, res) => { });

app.post("/login", (req, res) => {
  if (req.body) {
    const { name } = req.body;
    Users.push({ name })
    console.log(`Users => ${Users}`)
    console.log('cred => ', req.body);
  }
  res.status(200).send("OK");
});


app.get("/test", (req, res) => {
  res.status(200).send("OK");
});

server.listen(app.get("port"), () => console.log(`server listening on port ${app.get("port")}`));

module.exports = { app, Users, Rooms };
