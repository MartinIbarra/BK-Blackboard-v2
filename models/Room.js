const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: [true, "This room name already exists"],
    lowercase: true,
    required: true,
  },
});

const Room = mongoose.model("room", roomSchema);

module.exports = Room;
