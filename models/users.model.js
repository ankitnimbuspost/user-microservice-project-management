const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const userSchema = mongoose.Schema({
    f_name:{
        type:String,
        required:true,
        minlength:2,
        maxlength:50
    },
    l_name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
        index:true,
    },
    phone:{
        type:String,
        required:true,
        unique:true,
        index:true,
    },
    password:{
        type:String,
        required:true,
        select: false
    },
    gender:{
        type:String,
        enum:['male', 'female', 'other']
    },
    address:{
        type:String,
        default:""
    },
    role:{
        type:String,
        default:0,
        enum:['admin','manager','developer','owner'],
        default:"developer"
    },
    company_id:{
        ref:"company_details",
        type : mongoose.Schema.Types.ObjectId,
        default : "",
        index:true,
    },
    phone_verified:{
        type:Number,
        default:0,
        enum:[0,1]
    },
    email_verified:{
        type:Number,
        default:0,
        enum:[0,1]
    },
    status:{
        type:Number,
        default:1,
        enum:[0,1]
    },
    access_token:{
        type:String,
        default:""
    },
    socket_id:{
        type:String,
        default:""
    },
    profile_image:{
        type:String,
        default:""
    },
    job_title:{
        type:String,
        default: ""
    },
    department:{
        type:String,
        default:""
    },
    mfa:{
        type:Boolean,
        default:false,
    },
    created:{
        type:Number,
        default:Math.floor(Date.now()/1000)
    },
    updated:{
        type:Number,
        default:Math.floor(Date.now()/1000)
    }
});


// Static method to check if phone number exists
userSchema.statics.checkPhoneExists = async function(phoneNumber) {
    const user = await this.findOne({ phone: phoneNumber });
    return !!user; // Returns true if user with phone number exists, false otherwise
};
// Static method to check if Email exists
userSchema.statics.checkEmailExists = async function(email){
    const user = await this.findOne({email:email});
    return !!user;
}
// Static method to check if Password Match or Not
userSchema.statics.checkPasswordMatch = async function(email,password){
    let user =  await this.findOne({email:email}).select("+password");
    return await bcrypt.compare(password, user.password);
}
// This Function Check User exists or not using array 
userSchema.statics.checkUserExists = async function(user_ids){
    let status = {};
    for (const user_id of user_ids) {
        try {
            status[user_id] = await this.countDocuments({ _id: user_id });
        } catch (error) {
            status[user_id] = 0;
        }
    }
    console.log(status)
    return status;
}



const UsersModel = mongoose.model("users",userSchema);
module.exports = UsersModel;