const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const jobRoutes = require("./routes/jobRoutes");
const questionRoutes = require("./routes/questionRoutes");
const CommunityMessage = require("./models/CommunityMessage");
const { startReminderCron } = require("./utils/reminderCron");

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Socket.io Real-Time Setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// REST API Routes
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/questions", questionRoutes);

// Fetch last 50 messages for a domain room
app.get("/api/community/:room", async (req, res) => {
  try {
    const messages = await CommunityMessage.find({ room: req.params.room })
      .sort({ createdAt: 1 })
      .limit(50);
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching community messages:", error.message);
    res.status(500).json({ message: "Failed to fetch room messages" });
  }
});

// Health Check Route
app.get("/", (req, res) => {
  res.send("Placement Tracker API with AI & Real-Time Community is running!");
});

// Socket.io Event Handlers
io.on("connection", (socket) => {
  socket.on("join_room", (room) => {
    socket.join(room);
  });

  socket.on("send_message", async (data) => {
    try {
      const { room, senderName, senderId, text } = data;
      if (!room || !text || !text.trim()) return;

      const savedMsg = await CommunityMessage.create({
        room,
        senderName: senderName || "Student",
        senderId: senderId || "",
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