const mongoose = require("mongoose");

const departmentSchema = mongoose.Schema({
    department:{
        required:true,
        type:String,
        unique:true
    },
    added_by:{
        required:true,
        type:mongoose.Schema.Types.ObjectId,
        ref:"users"
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

const DepartmentModel = mongoose.model("departments",departmentSchema);
module.exports = DepartmentModel;