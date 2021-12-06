import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import User from "./models/user.js";

dotenv.config();

mongoose.connect(process.env.MONGODB_URI);

const app = express();
const PORT = process.env.PORT || 3003;
const mongoConnectionString = process.env.MONGODB_URI;
//const mongoConnectionString = "mongodb://localhost:27017/showcase";
//const client = new MongoClient(mongoConnectionString);
mongoose.connect(mongoConnectionString);

app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET || "tempsecret",
  })
);

//const UserModel = mongoose.model("user", userSchema, "users");

// const users = [

app.get("/User", async (req, res) => {
  const user = await User.find();
  res.json(user);
});

app.post("/login", async (req, res) => {
  const username = req.body.username;
  // const password = req.body.password;
  let user = await User.findOne({ username: username });
  console.log(user);
  if (!user) {
    user = await User.findOne({ username: "anonymousUser" });
  }
  req.session.user = user;
  req.session.save();
  res.json(user);
});

app.get("/currentuser", async (req, res) => {
  let user = req.session.user;

  if (!user) {
    user = await User.findOne({ username: "anonymousUser" });
  }
  console.log(user);
  res.json(user);
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  const user = users.find((user) => user.username === "anonymousUser");
  res.json(user);
});

app.listen(PORT, (req, res) => {
  console.log(`API listening on port http://localhost:${PORT}`);
});
