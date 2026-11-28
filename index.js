const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const jobRoutes = require("./routes/jobRoutes");
const questionRoutes = require("./routes/questionRoutes");

const User = require("./models/User");
const CommunityMessage = require("./models/CommunityMessage");
const { startReminderCron } = require("./utils/reminderCron");

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/questions", questionRoutes);

// Health Check Route
app.get("/", (req, res) => {
  res.send("Placement Tracker Backend API is running!");
});

// Helper: Extract real user name & ID from JWT token
// Helper: Extract real user name & ID from JWT token
const getUserFromToken = async (token) => {
  try {
    if (!token) return null;
    const cleanToken = token.replace("Bearer ", "").trim();
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
    const uid = decoded.id || decoded._id || decoded.userId || decoded.user?.id;
    if (!uid) return null;

    // Fetch full user doc so we catch name, username, fullName, or email
    const user = await User.findById(uid).lean();
    if (!user) return { id: String(uid), name: "Student" };

    const realName =
      (user.name && user.name.trim()) ||
      (user.username && user.username.trim()) ||
      (user.fullName && user.fullName.trim()) ||
      (user.email ? user.email.split("@")[0] : "Student");

    return {
      id: String(user._id),
      name: realName,
    };
  } catch (err) {
    console.error("getUserFromToken error:", err.message);
    return null;
  }
};
// Get current logged-in user's real name & ID for Community Hub
app.get("/api/community-user/me", async (req, res) => {
  const userInfo = await getUserFromToken(req.headers.authorization);
  if (!userInfo) {
    return res.status(401).json({ message: "Invalid token" });
  }
  res.status(200).json(userInfo);
});

// REST API to fetch last 50 messages of a domain room
app.get("/api/community/:room", async (req, res) => {
  try {
    const messages = await CommunityMessage.find({ room: req.params.room })
      .sort({ createdAt: 1 })
      .limit(50);
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch room messages" });
  }
});

// Real-Time Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("join_room", (room) => {
    socket.join(room);
  });

  socket.on("send_message", async (data) => {
    try {
      const { room, token, text } = data;
      if (!room || !text || !text.trim()) return;

      const userInfo = await getUserFromToken(token);

      const savedMsg = await CommunityMessage.create({
        room,
        senderName: userInfo?.name || "Student",
        senderId: userInfo?.id || "",
        text: text.trim(),
      });

      io.to(room).emit("receive_message", savedMsg);
    } catch (error) {
      console.error("Socket send_message error:", error.message);
    }
  });
});

// MongoDB Connection & Server Start
const PORT = process.env.PORT || 10000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Atlas Connected Successfully!");
    startReminderCron();
    server.listen(PORT, () => {
      console.log(`Server started and listening on port : ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });