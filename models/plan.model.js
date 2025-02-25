const mongoose = require("mongoose");
const PlanSchema = new mongoose.Schema({
    name: { type: String, required: true },
    maxProjects: { type: Number, required: true },
    maxUsers: { type: Number, required: true },
    maxStorage: { type: Number, required: true }, // In MB
    description:{type:String,required:false},
    level:{type:String,required:true,unique:true},
    durations: [
        {
            months: { type: Number, required: true,index: true}, // e.g., 3, 6, 12
            price: { type: Number, required: true } // e.g., 600, 900, 1100
        }
    ],
    created: { type: Number, default: Math.floor(Date.now() / 1000) },
    updated: { type: Number, default: Math.floor(Date.now() / 1000) }
});


PlanSchema.statics.getPlan = async function(plan_id=false){
    if(!plan_id)
        return false;
    try {
        const plan = await this.findOne({ _id: plan_id });
        return plan;
    } catch (error) {
        console.log(error.message);
        return false;
    }
}

// Static method to check plan exists or not
PlanSchema.statics.checkPlanExists = async function(plan_id) {
    try {
        if (!mongoose.Types.ObjectId.isValid(plan_id))
            return false;
        return await this.exists({ _id: plan_id }) !== null;
    } catch (error) {
        console.error("Error checking plan existence:", error.message);
        return false;
    }
};

// Static method to check plan exists or not
PlanSchema.statics.checkPlanDurationExists = async function(plan_id,duration_id) {
    try {
        if (!mongoose.Types.ObjectId.isValid(plan_id) || !mongoose.Types.ObjectId.isValid(duration_id))
            return false;
        return await this.exists({ _id: plan_id,"durations._id":duration_id }) !== null;
    } catch (error) {
        console.error("Error checking plan duration existence:", error.message);
        return false;
    }
};

const PlanModel = mongoose.model("plans",PlanSchema);
module.exports =PlanModel;