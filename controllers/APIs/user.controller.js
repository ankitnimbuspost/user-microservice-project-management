const UsersModel = require("../../models/users.model");
const httpCode = require("../../config/error.config");
const { sendInvitationMail } = require("../../services/Common.service");
const UserSettings = require("../../models/users.settings.model");
const ChatHelper = require("../../socket/ChatHelper");
const { default: mongoose } = require("mongoose");
const UserPlanModel = require("../../models/user-plan.mode");
const { Helper } = require("../../helper/common-helper");

module.exports.getUserCompanyWise = async function(req,res){
    let user = await UsersModel.findOne({_id:req.user.id}).select({"company_id":1});
    let all_users = await UsersModel.find({company_id:user.company_id}).select({"f_name":1,'l_name':1,'profile_image':1});
    return res.json({code:httpCode.OK,"message":"Users data","data":all_users});
}

module.exports.shareInvitation = async function(req,res){
    if(req.body['email']=='' || req.body['email']==null)
        return res.status(httpCode.BAD_REQUEST).json({code:httpCode.BAD_REQUEST,"message":"Email ID field is required."});
    else
    {
        let user = await UsersModel.findOne({_id:req.user.id});
        sendInvitationMail(user,req.body['email']);
        return res.status(httpCode.OK).json({code:httpCode.OK,"message":`Successfully sent invitation to ${req.body['email']}.`});
    }
}

module.exports.setDirectMessageUser = async function(req,res){
    if(req.body['user_id']=='' || req.body['user_id']==null)
        return res.status(httpCode.BAD_REQUEST).json({code:httpCode.BAD_REQUEST,"message":"User ID field is required."});
    else
    {
        // Now Update User Setting (Update Latest User & contacts)
        ChatHelper.updateLatestUser(req.user.id,req.body['user_id'],"user").then().catch((err)=>{
            console.log(err.message);
        });
        return res.status(httpCode.OK).json({code:httpCode.OK,"message":`Successfully set user to direct contacts.`,"data":req.body['user_id']});
    }
}

module.exports.createUpdatePricingPlan = async function(req,res){
    const PlanModel = require("../../models/plan.model");
    if (!req.body.plan_id)
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Plan ID field is required." });
    if (!req.body.duration_id)
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Duration ID field is required." });
    
    try {
        const user = await UsersModel.findOne({ _id: req.user.id }).select("company_id").lean();
        if (!user?.company_id)
            return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Please complete KYC." });

        // Check Plan & Duration in Parallel
        const [planExists, durationExists] = await Promise.all([
            PlanModel.checkPlanExists(req.body.plan_id),
            PlanModel.checkPlanDurationExists(req.body.plan_id, req.body.duration_id)
        ]);

        if (!planExists)
            return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Plan ID field is invalid." });
        if (!durationExists) 
            return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Duration ID field is invalid." });
        let current_user_plan = await UserPlanModel.getCompanyPlan(user.company_id);
        let plan = await PlanModel.getPlan(req.body.plan_id);
        const plan_duration = plan.durations.find(d => d._id.toString() === req.body.duration_id);
        if(!plan || !plan_duration)
            throw Error("Invalid Plan or Duration.");
        let user_plan = null;
        if(current_user_plan==null)
        {
            // Its Means User not have any active plans 
            user_plan = await UserPlanModel.buyPlan(user.company_id,req.body.plan_id,req.body.duration_id,plan_duration.months);
            return res.status(httpCode.OK).json({ code: httpCode.OK, message: "Plan Purchased successfully.",data:user_plan });
        }
        else{
            if(current_user_plan.plan_details.level>plan.level)
                return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "You can not downgrade plan, Please choose same plan or higher plan." });
            else if(current_user_plan.plan_details.level == plan.level){
                // Its Means user purchase same plan 
                user_plan = await UserPlanModel.upgradePlan(user.company_id,req.body.plan_id,req.body.duration_id,plan_duration.months)
                return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Plan Purchased successfully.",data:user_plan });
            }
            else{
                // Its Means user purchase higher plan 
                user_plan = await UserPlanModel.upgradeHighPlan(user.company_id,req.body.plan_id,req.body.duration_id,plan_duration.price,plan_duration.months)
                return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Plan Purchased successfully.",data:user_plan });
            }
        }
    } catch (error) {
        console.error("Error in createUpdatePricingPlan:", error);
        return res.status(httpCode.INTERNAL_SERVER_ERROR).json({ code: httpCode.INTERNAL_SERVER_ERROR, message: error.message});
    }
    
}