const jwt = require("jsonwebtoken");
require('dotenv').config();


const verifyToken = (req, res, next) => {

try{
const authHeader = req.header("Authorization");
if (!authHeader) {
    return res.status(401).json({
        message: "No token provided"
    });
}

const token = authHeader.split(" ")[1];

const verified = jwt.verify(
    token,
    process.env.JWT_SECRET
);

req.user = verified;
next();
}
catch (error) {
    res.status(400).json({ error: "Invalid Token!" });
  }
};

module.exports = verifyToken;