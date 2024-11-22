const UsersModel = require("../../models/users.model");
const httpCode = require("../../config/error.config");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const CompanyModel = require("../../models/company.model");
const {sendOTP} = require('../../services/Common.service');
const OTPModel = require("../../models/otp.model");
const dataconfig = require('../../config/data.config');
const path = require('path');
const fs = require("fs");
const QueueService = require("../../services/RabbitMQ.service")


// API Sign UP Code 
module.exports.signup = async function(req,res){
    // Now Add Validation 
    if(req.body['f_name']=='' || req.body['f_name']==null)
        return res.json({code:httpCode.BAD_REQUEST,"message":"First Name field is required."});
    else if(req.body['l_name']=='' || req.body['l_name']==null)
        return res.json({code:httpCode.BAD_REQUEST,"message":"Last Name field is required."});
    else if(req.body['email']=='' || req.body['email']==null)
        return res.json({code:httpCode.BAD_REQUEST,"message":"Email field is required."});
    else if(req.body['phone']=='' || req.body['phone']==null)
        return res.json({code:httpCode.BAD_REQUEST,"message":"Phone Number field is required."});
    else if(req.body['password']=='' || req.body['password']==null)
        return res.json({code:httpCode.BAD_REQUEST,"message":"Password field is required."});
    else if(req.body['gender']=='' || req.body['gender']==null)
        return res.json({code:httpCode.BAD_REQUEST,"message":"Gender field is required."});
    else if(req.body['role']!=undefined && req.body['role']!='' && !['admin','manager','developer','owner'].includes(req.body['role']))
        return res.json({code:httpCode.BAD_REQUEST,"message":"Incorrect role. Please choose role in below list admin, manager, developer, owner"});
    else if(await UsersModel.checkPhoneExists(req.body['phone']))
        return res.json({code:httpCode.CONFLICT,"message":"Phone Number already has been taken."});
    else if(await UsersModel.checkEmailExists(req.body['email']))
        return res.json({code:httpCode.CONFLICT,"message":"Email ID already has been taken."});
    else
    {
        let company_id = null;
        if(req.body['owner_ref']!==null && req.body['owner_ref']!=null)
        {
            let u = await UsersModel.checkUserExists([req.body['owner_ref']]);
            if(u[`${req.body['owner_ref']}`]==0)
                return res.json({code:httpCode.BAD_REQUEST,"message":"Invalid Owner Reference."});
            let user_company = await CompanyModel.findOne({user_id:req.body['owner_ref']}).select({company_name:1});
            if(!user_company)
                return res.json({code:httpCode.BAD_REQUEST,"message":"Owner KYC not completed."});
            company_id = user_company._id;
        }
        
        let data= {
            f_name: req.body['f_name'],
            l_name: req.body['l_name'],
            email: req.body['email'],
            phone: req.body['phone'],
            password: await bcrypt.hash(req.body['password'],10),
            gender: req.body['gender'].toLowerCase(),
            role : req.body['role'] ? req.body['role'] : "developer",
            company_id: company_id
        }
        
        // Now Add This user into DB 
        let user =  await  new UsersModel(data);
        user.save();
        res.json({
            code: httpCode.OK,
            message:"User successfully created.",
            data:user
        })
    }
}

module.exports.signin = async function(req,res){
    if(req.body['email']=='' || req.body['email']==null)
        return res.json({code:httpCode.BAD_REQUEST,"message":"Email field is required."});
    else if(req.body['password']=='' || req.body['password']==null)
        return res.json({code:httpCode.BAD_REQUEST,"message":"Password field is required."});
    else
    {
        let email = req.body['email'];
        let user = await UsersModel.findOne({email:email});
        if(user==null || user=='')
            return res.json({code:httpCode.UNAUTHORIZED,"message":"Invalid Credentials."});
        else if(!await UsersModel.checkPasswordMatch(email,req.body['password']))
            return res.json({code:httpCode.UNAUTHORIZED,"message":"Invalid Credentials."});
        else if(!user.phone_verified)
            return res.json({code:httpCode.BAD_REQUEST,"message":"Please verify Phone Number."});
        else if(!user.email_verified)
            return res.json({code:httpCode.BAD_REQUEST,"message":"Please verify Email ID."});
        else if(!user.status)
            return res.json({code:httpCode.BAD_REQUEST,"message":"Your account disabled by admin please contact support team."});
        else
        {
            // Now Sign in using JWT 
            var access_token = jwt.sign({ id: user._id,email:user.email }, process.env.APP_KEY, { expiresIn: '10d' });
            let user1 = await UsersModel.findOneAndUpdate({email:email},{ $set: { "access_token":access_token } },{ new: true });
            return res.json({code:httpCode.OK,"message":"Successfully Signin","data":user1});
        }
    }
}

module.exports.logout = async function(req,res){
    res.json({});
}

module.exports.userDetails = async function(req,res){
    console.log(req.user);
    let user = await UsersModel.findOne({_id:req.user.id});
    return res.json({code:httpCode.OK,"message":"User details.","data":user});
}

module.exports.forgotPassword = async function(req,res){
    if(req.body['email']=='' || req.body['email']==null)
        return res.status(httpCode.BAD_REQUEST).json({code:httpCode.BAD_REQUEST,"message":"Email field is required."});
    else
    {
        let user_details = await UsersModel.findOne({email:req.body['email']});
        if(user_details!=null)
        {
            let otp = await sendOTP(req.body['email']);
            // Delete Previous FORGOT_PASSWORD OTP 
            await OTPModel.deleteMany({user_id:user_details._id,"type":"FORGOT_PASSWORD"});
            await  OTPModel.create({user_id:user_details._id,"otp":otp,"type":"FORGOT_PASSWORD"});
            return res.status(httpCode.OK).json({code:httpCode.OK,"message":"Successfully sent OTP on your registered email id.",data:user_details});
        }   
        else
            return res.status(httpCode.NOT_FOUND).json({code:httpCode.NOT_FOUND,"message":"Invalid Email ID."});
    }
}

module.exports.updatePassword = async function(req,res){
    if(req.body['email']=='' || req.body['email']==null)
        return res.status(httpCode.BAD_REQUEST).json({code:httpCode.BAD_REQUEST,"message":"Email field is required."});
    else if(req.body['otp']=='' || req.body['otp']==null)
        return res.status(httpCode.BAD_REQUEST).json({code:httpCode.BAD_REQUEST,"message":"OTP field is required."});
    else if(req.body['new_password']=='' || req.body['new_password']==null)
        return res.status(httpCode.BAD_REQUEST).json({code:httpCode.BAD_REQUEST,"message":"New Password field is required."});
    else if(req.body['confirm_password']=='' || req.body['confirm_password']==null)
        return res.status(httpCode.BAD_REQUEST).json({code:httpCode.BAD_REQUEST,"message":"Confirm Password field is required."});
    else if(req.body['confirm_password']!=req.body['new_password'])
        return res.status(httpCode.BAD_REQUEST).json({code:httpCode.BAD_REQUEST,"message":"Confirm Password must be equal to New password."});
    else
    {
        let user_details = await UsersModel.findOne({email:req.body['email']}).select({"email":1});
        if(user_details!=null)
        {
            let otpDetails = await OTPModel.findOne({"user_id":user_details._id,'type':'FORGOT_PASSWORD','otp':req.body['otp']});
            if(otpDetails!=null)
            {
                let current_date = Math.floor(Date.now()/1000);
                let minutes_diff = Math.floor((current_date - otpDetails.created)/60);
                if(dataconfig.OTP_EXPIRE_TIME>=minutes_diff)
                {
                    let password = await bcrypt.hash(req.body['new_password'],10);
                    await UsersModel.findOneAndUpdate({"_id":user_details._id},{"$set":{'password':password}});
                    return res.status(httpCode.OK).json({code:httpCode.OK,"message":"Password reset successfully."});
                }
                else
                    return res.status(httpCode.BAD_REQUEST).json({code:httpCode.BAD_REQUEST,"message":"OTP has been expired, Please try again."});
            }
            else
                return res.status(httpCode.NOT_FOUND).json({code:httpCode.NOT_FOUND,"message":"Invalid OTP."});
        }   
        else
            return res.status(httpCode.NOT_FOUND).json({code:httpCode.NOT_FOUND,"message":"Invalid Email ID."});
    }
}

//Update User Profile
module.exports.updateUserProfile = async function(req,res){
    if(req.body['f_name']=='' || req.body['f_name']==null)
        return res.status(httpCode.BAD_REQUEST).json({code:httpCode.BAD_REQUEST,"message":"First Name field is required."});
    else if(req.body['l_name']=='' || req.body['l_name']==null)
        return res.status(httpCode.BAD_REQUEST).json({code:httpCode.BAD_REQUEST,"message":"Last Name field is required."});
    else
    {
        
        let updateData = {
            job_title: req.body['job_title'] ?? '',
            department: req.body['department'] ?? '',
            address : req.body['address'] ?? '',
            f_name: req.body['f_name'],
            l_name:req.body['l_name']
        }
        let profile_image = req.body['profile_image'] ?? '';
        if(profile_image)
        {
            try {
                // Remove "data:image/<type>;base64," from the base64 string
                const base64Data = profile_image.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');
                let filename = `${req.user.id}-${req.body['f_name'].replace(/\s+/g, '').trim()}.png`;
                const filePath = path.join('public/uploads/profile', filename);
                updateData.profile_image = `uploads/profile/${filename}`;
                await fs.writeFileSync(filePath, buffer)
            } catch (error) {
                return res.status(httpCode.BAD_REQUEST).json({code:httpCode.BAD_REQUEST,"message":error.message});
            }
        }
        let prev_data = await UsersModel.findOne({_id:req.user.id});
        let data = await UsersModel.findOneAndUpdate({"_id":req.user.id},{"$set":updateData},{ new: true })
        let logdata= {
            user_id: req.user.id,
            action:"PROFILE_UPDATE",
            prev_data: prev_data,
            current_data:data
        }
        QueueService.sendLocalQueue({"event":"LOG","data":logdata});
        return res.status(httpCode.OK).json({code:httpCode.OK,"message":"Successfully Profile Updated.",data});
    }
}
