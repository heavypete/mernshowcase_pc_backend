import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import UserModel from "./models/user.js";
import bcrypt from "bcrypt";

dotenv.config();
const saltRounds = Number(process.env.SALT_ROUNDS);

mongoose.connect(process.env.MONGODB_URI);

const app = express();
const PORT = process.env.PORT || 3003;

const mongoConnectionString = process.env.MONGODB_URI;
mongoose.connect(mongoConnectionString);

app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3001",
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

const userIsInGroup = (user, accessGroup) => {
  const accessGroupArray = user.accessGroups.split(",").map((m) => m.trim());
  console.log(accessGroupArray);
  return accessGroupArray.includes(accessGroup);
};

app.get("/user", async (req, res) => {
  const user = await UserModel.find();
  res.json(user);
});

app.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  let dbUser = await UserModel.findOne({ username: username });
  console.log("login function triggered");
  if (!dbUser) {
    dbUser = await UserModel.findOne({ username: "anonymousUser" });
  } else {
    bcrypt.compare(password, dbUser.hash).then((passwordIsOk) => {
      if (passwordIsOk) {
        console.log("test line 60");
        req.session.user = dbUser;
        req.session.save();
        res.json(dbUser);
      } else {
        console.log("test");
        res.sendStatus(403);
      }
    });
  }
});

app.get("/currentuser", async (req, res) => {
  let user = req.session.user;

  if (!user) {
    user = await UserModel.findOne({ username: "anonymousUser" });
  }
  console.log(user);
  res.json(user);
});

app.post("/createuser", async (req, res) => {
  const frontendUser = req.body.user;
  console.log(frontendUser);
  if (
    frontendUser.username.trim() === "" ||
    frontendUser.password1.trim() === "" ||
    frontendUser.password1 !== frontendUser.password2
  ) {
    res.sendStatus(403);
  } else {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(frontendUser.password1, salt);
    const backendUser = {
      firstName: frontendUser.firstName,
      lastName: frontendUser.lastName,
      username: frontendUser.username,
      email: frontendUser.email,
      hash,
      accessGroups: "loggedInUsers, notYetApprovedUsers",
    };
    const dbuser = await UserModel.create(backendUser);
    res.json({
      userAdded: dbuser,
    });
  }
});

app.post("/approveuser", async (req, res) => {
  const id = req.body.id;

  let user = await req.session.user;
  console.log(user);
  if (!user) {
    res.sendStatus(403);
  } else {
    if (!userIsInGroup(user, "admins")) {
      res.sendStatus(403);
    } else {
      const updateResult = await UserModel.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { accessGroups: "loggedInUsers,members" } },
        { new: true }
      );
      res.json({ result: updateResult });
    }
  }
});

app.get("/notyetapprovedusers", async (req, res) => {
  const users = await UserModel.find({
    accessGroups: { $regex: "notYetApprovedUsers", $options: "i" },
  });
  res.json({ users });
});

app.get("/logout", async (req, res) => {
  console.log("Haalloo");
  req.session.destroy();
  const user = await UserModel.findOne({ username: "anonymousUser" });
  res.json(user);
});

app.listen(PORT, (req, res) => {
  console.log(`API listening on port http://localhost:${PORT}`);
});
