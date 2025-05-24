const mongoose = require("mongoose");
const PanelLog = require("./panel_log.model");

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
    }],
    last_used_user_group:{
        type:{
            type:String,
            enum:['user','group'],
            default:"user",
            required:false
        },
        id:{
            type:mongoose.Schema.ObjectId,
            default:null,
            required:false
        }
    },
    created:{
        type:Number,
        default: Math.floor(Date.now()/1000)
    },
    updated:{
        type:Number,
        default: Math.floor(Date.now()/1000)
    },
},{timestamps:false});

settingSchema.statics.updateSetting= async function(user_id,data){
    try {
        let setting = await this.findOne({user_id:user_id});
        let previous_data = {};
        if(setting==null){
            data.user_id = user_id;
            await  this.create(data);
        }
        else
        {
            await UserSettings.findOneAndUpdate({user_id:user_id},{"$set":data})
            Object.keys(data).forEach(key => {
                previous_data[key] = setting[key]
            });
        }
        let request = {
            prev_data:previous_data,
            current_data:data,
            user_id: user_id,
            action:"USER_SETTING_UPDATE"
        }
        PanelLog.createLog(request).then().catch((err)=>{console.log(err.message)});
        return true;
    } catch (error) {
        console.log(error.message)
        throw Error(`Setting update problem: Setting not update user_id ${user_id}`);
    }
}

const UserSettings = mongoose.model("users_setting",settingSchema);
module.exports = UserSettings;
