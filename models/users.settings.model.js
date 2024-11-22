const mongoose = require("mongoose");

const settingSchema =  mongoose.Schema({
    user_id:{
        required:true,
        ref:"users",
        type:mongoose.Schema.Types.ObjectId,
    },
    users_contacts:[{
        required:false,
        ref:"users",
        type:mongoose.Schema.Types.ObjectId
    }]
},{timestamps:true});

const UserSettings = mongoose.model("users_setting",settingSchema);
module.exports = UserSettings;
