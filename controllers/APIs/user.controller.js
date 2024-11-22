const UsersModel = require("../../models/users.model");
const httpCode = require("../../config/error.config");
const { sendInvitationMail } = require("../../services/Common.service");

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