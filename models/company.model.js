const mongoose = require('mongoose');
const dataconfig = require('../config/data.config');
const UsersModel = require('./users.model');

const companySchema = mongoose.Schema({
    user_id:{
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"users"
    },
    company_name:{
        type:String,
        required:true,
    },
    company_code:{
        type:String,
        default:""
    },
    company_address:{
        type:String,
        required:true
    },
    company_pan:{
        type:String,
        // required:true,
    },
    company_gst:{
        type:String
    },
    company_type:{
        type:String,
        enum:dataconfig.company_types,
        required:true
    },
    total_task:{
        type:Number,
        required:true,
        default:0
    },
    status:{
        type:Number,
        enum:[0,1,2], //Processing(0) Approve(1) Reject(2)
        default:0
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

companySchema.statics.getNewTaskID = async function(user_id){
    try {
        let user = await UsersModel.findOne({_id:user_id}).select({"company_id":1});
        let data = await this.findOne({_id:user.company_id});
        let total = data.total_task + 1;
        return data.company_code+total;
    } catch (error) {
        return false;
    }
}

const CompanyModel = mongoose.model("company_details",companySchema);

module.exports = CompanyModel;