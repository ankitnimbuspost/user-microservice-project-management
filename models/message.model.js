const mongoose = require("mongoose");

const replySchema = mongoose.Schema({
    reply_type:{
        type:String,
        required:true,
        enum:['text','image','zip','pdf','url']
    },
    reply:{
        type:String,
        required:true,
        default:""
    },
    seen:{
        type:Boolean,
        default:false
    },
    created:{
        type:Number,
        default: Math.floor(Date.now()/1000)
    },
    deleted:{
        type:Boolean,
        default:false
    }
});


const messageSchema = mongoose.Schema({
    sender_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users",
        required:true,
    },
    receiver_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users",
        required:true,
    },
    message_type:{
        type:String,
        required:true,
        default :""
        // enum:['text','image','zip','pdf','url']
    },
    message:{
        type:String,
        required:true,
        default:""
    },
    replies:[replySchema],
    seen:{
        type:Boolean,
        default:false
    },
    created:{
        type:Number,
        default: Math.floor(Date.now()/1000)
    },
    updated:{
        type:Number,
        default: ''
    },
    deleted:{
        type:Boolean,
        default:false
    }
});




const Messages = mongoose.model("messages",messageSchema);
module.exports= Messages;