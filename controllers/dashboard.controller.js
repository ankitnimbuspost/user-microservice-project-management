const DepartmentModel = require("../models/department.model")

module.exports.dashboard = async function (req,res) {
    let dept = await new DepartmentModel()
    dept.added_by = '661253f489a31fa6c29b6c11';
    dept.department= "Ops";
    dept.save();
    res.send("Test page");
}