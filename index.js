const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); // Environment variables load karne ke liye

const port = process.env.PORT || 8000;

const authRoutes = require("./routes/authRoutes");
const applicationRoutes = require("./routes/applicationRoutes");

app.use(express.json());
app.use(cors());


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Atlas Connected Successfully!");
    
    app.listen(port, () => {
      console.log(`Server started at port : ${port}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB Connection Error: ", err);
  });

app.get("/", (req, res) => {
  res.send("Welcome to Placement Tracker API");
});

app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);