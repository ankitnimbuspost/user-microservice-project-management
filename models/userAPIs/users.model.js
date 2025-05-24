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
userSchema.statics.checkUserExists = async function (user_ids) {
    try {
        if (typeof user_ids === "string") {
            return mongoose.isValidObjectId(user_ids) && await this.exists({ _id: user_ids }) ? 1 : 0;
        }

        if (!Array.isArray(user_ids)) 
            throw new Error("Invalid input type");

        // Separate valid and invalid ObjectIds
        const validIds = user_ids.filter(id => mongoose.isValidObjectId(id));
        // Query only valid IDs
        const users = await this.find({ _id: { $in: validIds } }, "_id");

        // Prepare result with default 0 for all
        const status = Object.fromEntries(user_ids.map(id => [id, 0]));

        // Update found users to 1
        for (const user of users) {
            status[user._id.toString()] = 1;
        }
        return status;
    } catch (error) {
        console.error("Error checking user existence:", error.message);
        return Object.fromEntries(user_ids.map(id => [id, 0]));
    }
};
userSchema.statics.getBasicDetails = async function(user_id){
    try {
        let user = await this.findOne({_id:user_id}).select("f_name l_name email company_id").lean();
        if(!user)
            return false;
        return user;
    } catch (error) {
        return false;
    }
}

userSchema.statics.getBasicWithCompany = async function(user_id){
    try {
        let user = await this.findOne({_id:user_id}).populate({path:"company_id",select:"company_name company_code total_task status"})
        .select("f_name l_name email company_id").lean();
        if(!user)
            return false;
        return user;
    } catch (error) {
        return false;
    }
}
const UsersModel = mongoose.model("users",userSchema);
module.exports = UsersModel;