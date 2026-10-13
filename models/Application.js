const mongoose = require("mongoose") ;
const ApplicationSchema = new mongoose.Schema ({

companyName :{
type:String ,
required:true ,
},
role:{
  type:String,
},
status:{
  type:String ,
 enum: ['Applied', 'Interviewing', 'Selected', 'Rejected'],
  default: 'Applied',
},
userId:{
type:mongoose.Schema.Types.ObjectId,
ref:'User',
required: true
}
} ,
{timestamps :true},
)
module.exports = mongoose.model("Application", ApplicationSchema);
