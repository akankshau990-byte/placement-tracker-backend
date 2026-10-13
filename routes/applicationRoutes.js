const express = require("express");
const router = express.Router();
const { addApplication, getApplications } = require("../controllers/applicationController");
const Application = require("../models/Application");


const verifyToken = require("../middleware/authMiddleware");
router.post("/",verifyToken ,  addApplication);
router.get("/",verifyToken , getApplications);

router.delete("/:id", verifyToken , async (req, res) => {
  try {
    await Application.findByIdAndDelete(req.params.id);
    res.json({ message: "Application deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting application", error });
  }
});
router.put("/:id" , verifyToken , async(req ,res) =>{
  try{
    const updateApp = await Application.findByIdAndUpdate(
      req.params.id ,
      req.body,
      {new : true} 
    );
    res.json(updateApp);
  }
  catch(error){
    console.log("Update Error: ", error);
    res.status(500).json({ message: "Error updating application" });
  }
});

module.exports = router;