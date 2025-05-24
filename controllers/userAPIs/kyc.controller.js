const UsersModel = require("../../models/userAPIs/users.model");
const httpCode = require("../../config/error.config");
const CompanyModel = require("../../models/userAPIs/company.model");
const dataconfig = require('../../config/data.config')
const path = require("path")
module.exports.addUpdateKyc = async function (req, res) {
    if (req.body['company_name'] == '' || req.body['company_name'] == null)
        return res.json({ code: httpCode.BAD_REQUEST, "message": "Company Name field is required." });
    else if(req.body['company_address'] == '' || req.body['company_address'] == null)
        return res.json({ code: httpCode.BAD_REQUEST, "message": "Company Address field is required." });
    else if(req.body['company_pan'] == '' || req.body['company_pan'] == null)
        return res.json({ code: httpCode.BAD_REQUEST, "message": "Company Pan field is required." });
    else if(req.body['company_type'] == '' && req.body['company_type'] == null)
        return res.json({ code: httpCode.BAD_REQUEST, "message": "Company Type field is required." });
    else if(!dataconfig.company_types.includes(req.body['company_type']))
        return res.json({ code: httpCode.BAD_REQUEST, "message": "Company Type field is invalid." });
    else {
        let company_name = req.body['company_name'];
        let arr = company_name.split(" ");
        let company_code = arr.map((word)=>word.charAt(0))
    
        let data = {
            user_id: req.user.id,
            company_name: company_name,
            company_code:company_code.join("").toUpperCase(),
            company_address: req.body['company_address'],
            company_pan: req.body['company_pan'],
            company_type: req.body['company_type'],
            company_gst: req.body['company_gst'] ? req.body['company_gst'] : '',
            status: 0
        }
        let result = await CompanyModel.findOne({ "user_id": req.user.id });
        if (result) {
            if ([2].includes(result.status)) {
                let cmp = await CompanyModel.findOneAndUpdate({ user_id: req.user.id }, { "$set": data }, { new: true });
                await UsersModel.findOneAndUpdate({_id:req.user.id},{"$set":{company_id:cmp._id}})
                return res.json({ code: httpCode.OK, "message": "Successfully Updated Company Details", "data": cmp });
            }
            else if (result.status == 1)
                return res.json({ code: httpCode.OK, "message": "Can't be change KYC data again please contact support.", "data": result });
            else {
                return res.json({ code: httpCode.OK, "message": "Your request has already in processing.", "data": result });
            }
        }
        else {
            let cmp = await CompanyModel.create(data);
            // Update Company ID on users 
            await UsersModel.findOneAndUpdate({_id:req.user.id},{"$set":{company_id:cmp._id}})
            return res.json({ code: httpCode.OK, "message": "Successfully Created Company Details", "data": cmp });
        }
    }
}

// This function Upload Images Audio Video File 
module.exports.uploadFiles = async function (req, res) {
    if (req.files == undefined || req.files == null)
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "At leat one file is required." });
    else {
        // let allowedFiles = ['jpg','jpeg','png','webp','heic','gif','bmp','tif','tiff','svg','raw','cr2','nef','arw']
        async function uploadSingalFile(file) {
            const newFileName = `slack-files-${Date.now()}-${file.name.replace(/\s+/g, '').trim()}`;
            let uploadsDir = "public/uploads/chat_files"
            const uploadPath = path.join(uploadsDir, newFileName);
            let file_full_path = `${process.env.BACKEND_ADDRESS}/uploads/chat_files/${newFileName}`;
            file.mv(uploadPath);
            const fileExtension = path.extname(file.name);
            return {"url":file_full_path,"ext":fileExtension.replace(".","")};
        }
        let files = req.files['files'];
        let filesURL = [];
        if (Array.isArray(files)) {
            if(files.length<=20){
                // We gusse multiple file 
                await files.forEach(async(file) => {
                    let file_url = await uploadSingalFile(file);
                    filesURL.push(file_url );
                });
            }
            else
                return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Maximum file upload limit exceed, Only 20 files upload at a time." });
        }
        else {
            // We gusse singal file 
            let file_url = await uploadSingalFile(files);
            filesURL.push(file_url);
        }
        return res.status(httpCode.OK).json({ code: httpCode.OK, "message": "File Uploaded Successfully",data:filesURL});
    }
}