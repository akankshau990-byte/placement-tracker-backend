const mongoose = require("mongoose");

const communityMessageSchema = new mongoose.Schema(
  {
    room: {
      type: String,
      required: true,
      enum: ["MERN-Stack", "DSA-Grind", "Off-Campus-Leads", "Interview-Experiences"],
      default: "MERN-Stack",
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    senderId: {
      type: String,
      default: "",
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CommunityMessage", communityMessageSchema);