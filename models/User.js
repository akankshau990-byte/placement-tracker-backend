const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    type: String,
      default: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png", // Default Profile Icon
    },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);