const UsersModel = require("../../models/users.model");
const httpCode = require("../../config/error.config");
const { sendInvitationMail } = require("../../services/Common.service");
const UserSettings = require("../../models/users.settings.model");
const { default: mongoose } = require("mongoose");

module.exports.getUserCompanyWise = async function(req,res){
    if(req.body['company__id']=='' || req.body['company_id']==null)
        return res.json({code:httpCode.BAD_REQUEST,"message":"Company ID field is required."});
    else
    {
        let user = await UsersModel.find({company_id:req.body['company_id']}).select({"f_name":1,'l_name':1,'company_id':1});
        return res.json({code:httpCode.OK,"message":"Users data","data":user});
    }
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
        let setting = await UserSettings.findOne({user_id:req.user.id});
        let last_used_user={"type":"user","id":req.body['user_id']}
        let data = {"users_contacts":req.body['user_id'],last_used_user_group:last_used_user}
        if(setting!=null){
            try {
                let users_contacts = setting.users_contacts;
                users_contacts.push(new mongoose.Types.ObjectId(req.body['user_id']));
                data.users_contacts = [...new Set(users_contacts.map(contact => contact.toString()))];
            } catch (error) {
                console.log(error.message);
            }
        }
        UserSettings.updateSetting(req.user.id,data).then(data).catch((err)=>{
            console.log(err.message);
        });
        return res.status(httpCode.OK).json({code:httpCode.OK,"message":`Successfully set user to direct contacts.`,"data":req.body['user_id']});
    }
}