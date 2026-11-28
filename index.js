const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const questionRoutes = require("./routes/questionRoutes");
const port = process.env.PORT || 8000;
const { startReminderCron } = require("./utils/reminderCron");
const authRoutes = require("./routes/authRoutes");
const applicationRoutes = require("./routes/applicationRoutes");

app.use(express.json());
app.use(cors());
app.use("/api/jobs", require("./routes/jobRoutes"));
app.use("/api/questions", questionRoutes);
// Root test route
app.get("/", (req, res) => {
  res.send("Welcome to Placement Tracker API");
});

// Mounting Auth & Application Routes
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);

// Server listen
app.listen(port, "0.0.0.0", () => {
  console.log(`Server started and listening on port : ${port}`);
});

// Database connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Atlas Connected Successfully!");
    startReminderCron();
  })
  
  .catch((err) => {
    console.log("MongoDB Connection Error: ", err);
  });