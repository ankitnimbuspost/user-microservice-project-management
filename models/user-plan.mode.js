const mongoose = require("mongoose");
const { Helper } = require("../helper/common-helper");
const CompanyModel = require("./company.model");

const UserPlanSchema = new mongoose.Schema({
    company_id: { type: mongoose.Schema.Types.ObjectId, ref: "company_details", required: true,index:true },
    plan_id: { type: mongoose.Schema.Types.ObjectId, ref: "plans", required: true, index:true },
    duration_id: { type: mongoose.Schema.Types.ObjectId, required: true }, // Refers to durations._id in PlanModel
    start_date: { type: Number, default: 0 }, // Plan Start Date
    end_date: { type: Number, default: 0 }, // Plan End Date
    status: { type: String, enum: ["active", "expired", "cancelled"], default: "active",index:true },
    remarks:{type:String,required:false},
    created: { type: Number, default: Math.floor(Date.now() / 1000), index:true },
    updated: { type: Number, default: Math.floor(Date.now() / 1000) }
});

// ✅ Get the active plan for a company
UserPlanSchema.statics.getCompanyPlan = async function (company_id) {
    if (!company_id) return false;

    try {
        let plan = await this.findOne({ company_id, status: "active" }).populate("plan_id").lean();
        if (!plan)
            return null;
        plan.plan_details = plan.plan_id;
        delete plan.plan_id;
        return plan;
    } catch (error) {
        console.log("Error fetching company plan:", error.message);
        return null;
    }
};
UserPlanSchema.statics.buyPlan = async function (company_id, plan_id, duration_id, months) {
    try {
        let start_date = Math.floor(Date.now() / 1000);
        let futureDate = new Date(start_date * 1000); // Convert to milliseconds
        if (Helper.isFloat(months))
            futureDate.setDate(futureDate.getDate() + Math.round(months * 30)); // Add Days
        else
            futureDate.setMonth(futureDate.getMonth() + months); // Add months
        let end_date = Math.floor(futureDate.getTime() / 1000);

        user_plan = new UserPlanModel();
        user_plan.company_id = company_id;
        user_plan.plan_id = plan_id;
        user_plan.duration_id = duration_id;
        user_plan.start_date = start_date;
        user_plan.end_date = end_date;
        user_plan.status = "active";
        user_plan.remarks = "New plan purchased";
        await user_plan.save();
        return user_plan;
    } catch (error) {
        console.log("Error buying plan: ", error.message);
        return null;
    }
}

// ✅ Upgrade to the SAME plan (extend expiration)
UserPlanSchema.statics.upgradePlan = async function (company_id, plan_id, duration_id, months) {
    try {
        if (!Number.isFinite(months) || months <= 0) {
            throw new Error("Invalid duration: months should be a positive number.");
        }

        const currentPlan = await this.findOne({ plan_id:plan_id, status: "active" });
        if (!currentPlan) {
            let plan = await this.buyPlan(company_id, plan_id, duration_id, months);
            return plan;
        }
        const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
        let additionalTime = Math.round(months * 30 * 24 * 60 * 60); // Convert months (float) to seconds

        // Extend expiration date
        const newEndDate = Math.max(currentPlan.end_date, currentTime) + additionalTime;

        currentPlan.end_date = newEndDate;
        currentPlan.updated = currentTime;
        currentPlan.remarks = `Plan upgraded for ${months} months on ${new Date().toISOString()}`;
        await currentPlan.save();

        return currentPlan;
    } catch (error) {
        console.error("Error During plan upgradation: ", error.message);
        return null;
    }
};

// ✅ Upgrade to a HIGHER plan
UserPlanSchema.statics.upgradeHighPlan = async function (company_id, plan_id, duration_id,new_plan_price, months) {
    try {
        if (!Number.isFinite(months) || months <= 0) {
            throw new Error("Invalid duration: months should be a positive number.");
        }

        const currentPlan = await this.getCompanyPlan(company_id);
        if (!currentPlan) {
            let plan = await this.buyPlan(company_id, plan_id, duration_id, months);
            return plan;
        }
        const plan_duration = currentPlan.plan_details.durations.find(d => d._id.toString() === currentPlan.duration_id.toString());
        const currentTime = Math.floor(Date.now() / 1000);
        const remainingTime = currentPlan.end_date - currentTime;

        if (remainingTime <= 0) {
            // Expire previous plan 
            await this.updateOne({ company_id:company_id}, { status: "expired" });
            // Purchase new Plan 
            let plan = await this.buyPlan(company_id, plan_id, duration_id, months);
            return plan;
        }
    
        // Calculate remaining credit
        const oldPlanDuration = Math.round(plan_duration.months * 30 * 24 * 60 * 60);
        const oldPlanDurationDays = oldPlanDuration / (24 * 60 * 60); // Convert seconds to days
        const oldPlanDailyRate = plan_duration.price / oldPlanDurationDays; // Now using days
        const remainingDays = remainingTime / (24 * 60 * 60);
        const remainingCredit = oldPlanDailyRate * remainingDays;

        // Calculate adjusted cost for new plan
        const newPlanDurationSec = months * 30 * 24 * 60 * 60;
        const newPlanDurationDay = newPlanDurationSec /(24 * 60 * 60) // Convert seconds to days
        const newPlanDailyRate = new_plan_price / newPlanDurationDay;
        const adjustedDays = newPlanDailyRate > 0 ? remainingCredit / newPlanDailyRate : 0;
        if (!Number.isFinite(adjustedDays) || adjustedDays < 0) {
            throw new Error("Invalid adjustedDays: " + adjustedDays);
        }
        const newEndDate = currentTime + newPlanDurationSec + adjustedDays * 24 * 60 * 60;
        // Expire previous plan
        await this.updateOne({ company_id:company_id}, { status: "expired" });
        // Create new plan entry
        const newPlan = new this({
            company_id,
            plan_id: plan_id,
            duration_id:duration_id,
            start_date: currentTime,
            end_date: Math.floor(newEndDate),
            status: "active",
            created: currentTime,
            updated: currentTime,
            remarks:`Plan upgraded for ${months} months on ${new Date().toISOString()}`
        });

        await newPlan.save();
        await CompanyModel.updateOne({ _id:company_id}, { plan_id: plan_id });
        return newPlan;
    } catch (error) {
        console.error("Plan upgrade error:", error.message);
        return null;
    }
};

const UserPlanModel = mongoose.model("user_plans", UserPlanSchema);
module.exports = UserPlanModel;
