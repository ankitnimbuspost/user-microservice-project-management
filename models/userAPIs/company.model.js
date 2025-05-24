const mongoose = require('mongoose');
const dataconfig = require('../../config/data.config');
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
    plan_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "plans",
        required: false // optional
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
        await this.incrementTaskCount(user.company_id);
        let data = await this.findOne({_id:user.company_id});
        return data.company_code+data.total_task;
    } catch (error) {
        return false;
    }
}
companySchema.statics.incrementTaskCount = async function(company_id){
    try {
        let cmp = await this.findOne({_id:company_id});
        cmp.total_task = cmp.total_task + 1;
        await cmp.save();
        return true;
    } catch (error) {
        console.log(error.message);
        return false;
    }
}
companySchema.statics.getPlanDetails = async function(company_id=false){
    if(!plan_id)
        return false;

    try {
        const company = await this.findOne({ plan_id: company_id }).populate("plan");
        return company;
    } catch (error) {
        console.log(error.message);
        return false;
    }
}
const CompanyModel = mongoose.model("company_details",companySchema);

module.exports = CompanyModel;