const UsersModel = require("../../models/users.model");
const httpCode = require("../../config/error.config");
const { sendInvitationMail } = require("../../services/Common.service");
const UserSettings = require("../../models/users.settings.model");
const ChatHelper = require("../../socket/ChatHelper");
const { default: mongoose } = require("mongoose");

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