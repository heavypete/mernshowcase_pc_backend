import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: false },
    accessGroups: { type: String, required: true },
    hash: { type: String, required: true },
    password: { type: String, required: false },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "users",
  }
);

const UserModel = mongoose.model("UserModel", UserSchema);

export default UserModel;
