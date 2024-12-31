const { default: mongoose } = require("mongoose");
const Messages = require("../models/message.model");
const UsersModel = require("../models/users.model");
const UserSettings = require("../models/users.settings.model");

module.exports.setUserSession = function (user_id, socket_id) {
    return new Promise((resolve, reject) => {
        let user = UsersModel.findOneAndUpdate({ "_id": user_id }, { "$set": { 'socket_id': socket_id } });
        if (user)
            resolve(user);
        else
            reject("failed")
    });
}
module.exports.unsetUserSession = function (user_id) {
    return new Promise((resolve, reject) => {
        let user = UsersModel.findOneAndUpdate({ "_id": user_id }, { "$set": { 'socket_id': '' } });
        if (user)
            resolve(user);
        else
            reject("failed")
    });
}

// Save Private Message 
module.exports.savePrivateMessage = function (sender_id, request) {
    return new Promise((resolve, reject) => {
        if (!sender_id || request.send_to == undefined || request.message_type == undefined || request.message == undefined)
            reject("Validation error data not correct");
        else {
            let msg = new Messages();
            msg.sender_id = sender_id;
            msg.receiver_id = request.send_to;
            msg.message_type = request.message_type.toLowerCase();
            msg.message = request.message;
            msg.save();
            if (msg)
                resolve(msg);
            else
                reject("Message data not saved");
        }
    })
}

// Here Get All Private Message behalf of sender_id and receiver_id 
module.exports.getPrivateMessageList = async function (receiver_id, sender_id) {
    console.log(receiver_id,sender_id)
    // let messages = Messages.find({receiver_id:receiver_id,sender_id:sender_id,deleted:false})
    try {
        let messages = Messages.find({
            $or: [
                {
                    $and: [
                        { receiver_id: receiver_id },
                        { sender_id: sender_id }
                    ]
                },
                {
                    $and: [
                        { receiver_id: sender_id },
                        { sender_id: receiver_id }
                    ]
                }
            ],
            deleted: false
        })
        // .select({ 'message': 1, 'seen': 1, 'created': 1, 'updated': 1, 'replies': 1, 'message_type': 1 });
        return messages;
    } catch (error) {
        console.log(error.message);
        return [];
    }
}

//Seen Private Message
module.exports.seenPrivateMessage = async function (receiver_id, sender_id) {
    await Messages.updateMany({ receiver_id: receiver_id, sender_id: sender_id, deleted: false }, { '$set': { 'seen': true } });
}

module.exports.getSocketIdByUserId = async function (user_id) {
    // let data = await User
}

module.exports.getMyUserContacts = async function (user_id) {
    let users = await UserSettings.findOne({ user_id: user_id }).select({ "users_contacts": 1 });
    console.log(users);
}

module.exports.getDirectMessageUser = async function (user_id) {
    let setting = await UserSettings.findOne({ user_id: user_id }).select({ "users_contacts": 1 });
    if(setting)
        return  await UsersModel.find({_id:{"$in":setting.users_contacts}})
        .select({ "_id": 1, 'f_name': 1, l_name: 1, 'profile_image': 1, 'socket_id': 1 });
    return [];
}

module.exports.getUserGroupDetails = async function(id,type){
    if(type=='user'){
        let user = await UsersModel.findOne({_id:id}).select({ "_id": 1, 'f_name': 1, l_name: 1, 'profile_image': 1, 'socket_id': 1 });
        return user;
    }
    else{
        return {};
    }
}

module.exports.getUserGroups = async function(user_id){
    let groups = [
        {
            name:"Kleon Team"
        },
        {
            name:"UI/UX Community"
        },
        {
            name:"We Are Designer"
        },
        {
            name:"Future Boss Grou"
        },
        {
            name:"Team Community"
        },
        {
            name:"Backend Team"
        },
    ];
    return groups;
}
module.exports.updateLatestUser = async function(current_user_id=null,to_user_id=null,type=null){
    if(current_user_id==null || to_user_id==null || type==null)
        return false;

    // Now Update User Settings 
    let setting = await UserSettings.findOne({user_id:current_user_id}).select({"users_contacts":1});
    let last_used_user={"type":type.toLowerCase(),"id":to_user_id}
    let data = {"users_contacts":to_user_id,last_used_user_group:last_used_user}
    if(setting!=null){
        try {
            let check = await UserSettings.findOne({"last_used_user_group.id":to_user_id}).select({_id:1});
            if(check)
                return true;
            let users_contacts = setting.users_contacts;
            users_contacts.push(new mongoose.Types.ObjectId(to_user_id));
            data.users_contacts = [...new Set(users_contacts.map(contact => contact.toString()))];
        } catch (error) {
            console.log(error.message);
        }
    }
    await UserSettings.updateSetting(current_user_id,data);
    return true;
}