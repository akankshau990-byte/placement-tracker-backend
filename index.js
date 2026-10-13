const express = require("express") ;
const app = express() ;
const mongoose = require("mongoose") ;
const cors = require("cors");
const port = 8000 ;

const authRoutes = require("./routes/authRoutes");
const applicationRoutes = require("./routes/applicationRoutes");

app.use(express.json());
app.use(cors());
mongoose.connect("mongodb://localhost:27017/placement-tracker")
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.log("MongoDB Error: ", err));


app.get("/" , (req ,res )=>{
  res.send("Welcome to Placement Tracker API");
});

app.use("/api/auth", authRoutes); 
app.use("/api/applications", applicationRoutes); 

app.listen(port ,()=>{
  console.log(`server started at port : ${port}`);
})