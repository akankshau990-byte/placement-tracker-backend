const application = require("../models/Application");
const Application = require("../models/Application");

const addApplication = async (req ,res) => {

  try{
    const {companyName , role ,status} =  req.body ;
     const  userId = req.user.userId;
     
     const newApp = await Application.create({
     companyName,
      role,
      status,
      userId
     });

     res.status(201).json({ message: "Application added!", application: newApp });
  } 

  catch(error){
    console.log("🔥 Add Application Error:", error);
   res.status(500).json({error : "failed to add application"}) ;
  }
};


const getApplications = async (req ,res)=>{
  try {
    const userId = req.user.userId ;
    const application = await Application.find({userId: userId}) ;
    res.status(200).json(application);
  }

  catch(error){
   res.status(500).json({ error: "Failed to fetch applications" });
  }
};

module.exports = {addApplication ,getApplications};

