const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
require('dotenv').config();
//Register logic 
const registerUser =  async(req ,res) =>{
  try{
    const {name ,email ,password} = req.body ;
   
// 1. Password ko Hash (Encrypt) karna
    const salt = await bcrypt.genSalt(10); // 10 rounds of encryption
    const hashedPassword = await bcrypt.hash(password, salt);
  
  const newUser = await User.create({
    name :name ,
    email : email ,
    password : hashedPassword});

  res.status(201).json({
    message: "User register successfully!",
    user :newUser
  });

}
  catch(error){
  console.log("Registration Error: ", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// Login logic 

const loginUser = async (req ,res) =>{
  try {
  const {email ,password} = req.body ;

  const user = await User.findOne({email: email}) ;
  if(!user) return res.status(404).json({message :"User not found!"});
  const isPasswordValid = await bcrypt.compare(password ,user.password);

  if(!isPasswordValid) return res.status(401).json({message: "invalid password"}) ;

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
 res.status(200).json({
      message: "Login Successful",
      token: token
    });

}
  catch(error){
 res.status(500).json({error : "Something went wrong"});
  }
};

module.exports = {registerUser , loginUser};

