require("dotenv").config();
const Pool = require("pg").Pool;
const bcrypt = require("bcrypt");

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "chat-database",
  password: process.env.DB_PASSWORD || "",
  port: parseInt(process.env.DB_PORT) || 5432,
});

const verifyUserName = async ({ name, email }) => {
  let response;
  try {
    response = await pool.query(
      `Select * from "Users" WHERE email = $1 AND name = $2`,
      [email, name]
    );
  } catch (err) {
    console.log(err);
    return err;
  }

  const { rows } = response;

  // console.log(rows);

  if (rows?.length > 0) {
    return rows[0];
  }

  return rows;
};

const getUser = async (id) => {
  let response = [];
  try {
    if (id) {
      response = await pool.query(`Select * from "Users" WHERE id = $1`, [id]);
    } else {
      response = await pool.query(`Select * from "Users"`);
    }
  } catch (err) {
    console.log(err);
    return err;
  }

  return response;
};

const createUser = async ({ email, name, hashedPassword }, callback) => {
  let user;
  let error;

  console.log(email, name, hashedPassword);

  try {
    const resUser = await pool.query(`Select * from "Users" WHERE email = $1`, [
      email,
    ]);
    // console.log(resUser);

    if (resUser.rows.length === 0) {
      user = await pool.query(
        `INSERT INTO "Users"(name, email, password) VALUES($1, $2, $3)`,
        [name, email, hashedPassword]
      );
    } else {
      throw new Error("user already exist");
    }
  } catch (err) {
    error = err;
    console.log(err);
    return err;
  }

  return user;
};

const getRooms = async (id) => {
  let response = [];
  try {
    if (id) {
      response = await pool.query(`Select * from "Rooms" WHERE id = $1`, [id]);
    } else {
      response = await pool.query(`Select * from "Rooms"`);
    }
  } catch (err) {
    console.log(err);
    return err;
  }

  return response;
};

const createRoom = async (name, callback) => {
  let error, room;
  try {
    room = await pool.query(`INSERT INTO "Rooms"(name) VALUES($1)`, [name]);
    // console.log("room created => ", room);
  } catch (err) {
    error = err;
    console.log("error al crear la sala", name);
  }
  return callback(error);
};

module.exports = { getUser, getRooms, createRoom, createUser, verifyUserName };
