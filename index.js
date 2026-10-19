const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const port = process.env.PORT || 8000;

const authRoutes = require("./routes/authRoutes");
const applicationRoutes = require("./routes/applicationRoutes");

app.use(express.json());
app.use(cors());

// Health Check Route (Render ke Port Scan ke liye)
app.get("/", (req, res) => {
  res.send("Welcome to Placement Tracker API");
});

app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);

// Server ko '0.0.0.0' host par bind karein taaki Render detect kar sake
app.listen(port, "0.0.0.0", () => {
  console.log(`Server started and listening on port : ${port}`);
});

// MongoDB Connection Background mein handle hone dein
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Atlas Connected Successfully!");
  })
  .catch((err) => {
    console.log("MongoDB Connection Error: ", err);
  });