const mongoose = require('mongoose');

const otpSchema = mongoose.Schema({
    user_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users",
        required:true
    },
    type:{
        type:String,
        enum:["FORGOT_PASSWORD",'LOGIN','OTHER']
    },
    otp:{
        type:Number,
        minlength:6,
        maxlength:6
    },
    created:{
        type:Number,
        default:Math.floor(Date.now()/1000)
    }
});

const OTPModel = mongoose.model("otp",otpSchema);
module.exports = OTPModel;