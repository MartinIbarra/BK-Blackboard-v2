const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { verifyUserName, createUser } = require("../db/index");

const bcrypt = require("bcrypt");

const maxAge = 5 * 24 * 60 * 60;

const createJWT = (id) => {
  return jwt.sign({ id }, "room secret", {
    expiresIn: maxAge,
  });
};

const alertError = (err) => {
  let errors = { name: "", email: "", password: "" };
  if (err.message == "incorrect email") {
    errors.email = "this email not found";
  }
  if (err.message == "incorrect password") {
    errors.password = "the password is incorrect";
  }
  if (err.code === 11000) {
    errors.email = "This email already registered";
    return errors;
  }

  if (err.message.includes("user validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }
  return errors;
};

module.exports.signup = async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // const findUser = await verifyUserName({ name, email, password });
    // console.log(findUser);
    // if(bcrypt.compareSync(password, findUser.))
    const user = await createUser({ name, email, hashedPassword });
    const token = createJWT(user._id);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(201).json({ user });
  } catch (err) {
    let errors = alertError(err);
    res.status(400).send({ errors });
  }
};
module.exports.login = async (req, res) => {
  const { email, name, password } = req.body;
  try {
    const user = await verifyUserName({ email, name });
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error("password or email incorrect");
    }

    const token = createJWT(user.id);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });

    const { password: _, ...publicUser } = user;

    res.status(201).json({ publicUser });
  } catch (err) {
    let errors = alertError(err);
    res.status(400).send({ errors });
  }
};

module.exports.verifyuser = async (req, res, next) => {
  const { name, email, password } = req.body;

  // const { id } = req.query;
  // const token = req.cookies.jwt
  // if(token){
  //     jwt.verify(token, 'room secret', async(err, decodedToken) =>{
  //         // console.log('decoded token', decodedToken)
  //         if(err){
  //             console.log(err.message)
  //         } else{
  //             let user = await User.findById(decodedToken.id)
  //             res.json(user)
  //             next()
  //         }
  //     })
  // } else {
  //     next()
  // }
  // const users = await getUser(id);

  const user = await verifyUserName({ name, email, password });
  res.status(200).json({
    user: user.rows,
  });
  next();
};

module.exports.logout = (req, res) => {
  res.cookie("jwt", "", { maxAge: 1 });
  res.status(200).json({ logout: true });
};
