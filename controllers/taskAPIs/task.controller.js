const httpCode = require("../../config/error.config");
const ProjectModel = require("../../models/project.model");
const TaskModel = require("../../models/task.model");
const MQService = require("../../services/RabbitMQ.service");
const Config = require("../../config/config");
const TaskStatusModel = require("../../models/taskStatus.model");
const TaskServices = require("../../services/TaskServices");


// This Function Create A new Task.
module.exports.createTask = async function (req, res) {
    let {task_type,owners,parent_task_id,reporter_id} = req.body;
    task_type = task_type?.toLowerCase() ?? '';

    if (req.body['project_id'] == '' || req.body['project_id'] == null)
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Project field is required." });

    else if (! await ProjectModel.checkProjectExists(req.body['project_id']))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Project, project not found." });

    else if (req.body['task_name'] == '' || req.body['task_name'] == null)
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Task Name field is required." });

    else if (req.body['task_desc'] == '' || req.body['task_desc'] == null)
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Task Description field is required." });

    else if (req.body['status'] != undefined && req.body['status'] != '' && ![1, 0].includes(req.body['status']))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Project status, Allowed values are [0,1]." });

    else if (req.body['tags'] != undefined && (!Array.isArray(req.body['tags']) || req.body['tags'].some(item => typeof item !== 'string')))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Tags. It must be an array of strings." });

    else if (req.body['attachment_urls'] != undefined && (!Array.isArray(req.body['attachment_urls']) || req.body['attachment_urls'].some(item => typeof item !== 'string')))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Attachment URLs. It must be an array of strings." });

    else if (req.body['owners'] != undefined && typeof req.body['owners'] != "object")
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Task owners." });

    else if (req.body['duration'] != undefined && typeof req.body['duration'] != "object")
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Task Duration." });

    else if (req.body['complete_per'] != undefined && req.body['complete_per'] != '' && typeof req.body['complete_per'] != "number")
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Project Completed persentage." });

    else if (req.body['priority'] != undefined && req.body['priority'] != '' && !['', 'High', 'Medium', 'Low'].includes(req.body['priority']))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Project priority, Allowed values are ['','High','Medium','Low']." });

    else if (req.body['task_status'] != undefined && req.body['task_status'] == '')
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Task status field is required." });

    else if (!Config.TASK_STATUS.includes(req.body['task_status']))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid task status." });

    else if (req.body['start_date'] !== undefined && req.body['start_date'] !== "" && (!Number.isInteger(Number(req.body['start_date'])) || Number(req.body['start_date']) <= 0))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Invalid Start Date. It must be a valid epoch timestamp."});

    else if (req.body['due_date'] !== undefined && req.body['due_date'] !== "" && (!Number.isInteger(Number(req.body['due_date'])) || Number(req.body['due_date']) <= 0))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Invalid Due Date. It must be a valid epoch timestamp."});

    else if(task_type!=="" && !Config.TASK_TYPES.includes(task_type))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": `Invalid Task type, Allowed values are [${Config.TASK_TYPES}].` });

    else if(task_type && task_type!=="task" && !parent_task_id)
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": `Parent Task ID field is required.` });
    
    else if(task_type!=="task" && parent_task_id && ! await TaskModel.checkTaskExists(parent_task_id))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": `Invalid Parent Task ID.` });
    else if(!reporter_id || reporter_id==undefined)
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Reporter ID field is required." });
    else {
        let duration = [];
        if (req.body['duration'] != undefined && req.body['duration'] != "") {
            duration = req.body['duration'];
            if (!duration.unit || !duration.value || typeof duration.unit != "string" || typeof duration.value != "number")
                return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Task Duration field structure." });
            else if (!(duration.unit.toLowerCase() == 'days' || duration.unit.toLowerCase() == 'hours'))
                return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Task Duration Unit, Allowed values are [Days,Hours]." });
            else
                duration.unit = duration.unit.toLowerCase();
        }
        if (req.body['complete_per'] != undefined && req.body['complete_per'] != "") {
            if (req.body['complete_per'] > 100 || req.body['complete_per'] < 0)
                return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Task Completed persentage, Allowed values are [0-100]." });
        }
        
        let data = {
            project_id: req.body['project_id'],
            added_by: req.user.id,
            task_name: req.body['task_name'],
            task_type : task_type ?? "task",
            parent_task_id: task_type !== "task" && parent_task_id != null ? parent_task_id : null,
            task_desc: req.body['task_desc'],
            status: req.body['status'] ??  1,
            tags: req.body['tags'] ?? [],
            start_date: req.body['start_date'] ?? null,
            due_date: req.body['due_date'] ?? null,
            complete_per: req.body['complete_per'] ?? '',
            priority: req.body['priority']?.toLowerCase() ?? "",
            duration: duration,
            owners: owners,
            reporter: (reporter_id!=undefined && reporter_id!='') ? reporter_id : null,
            task_status: req.body['task_status'] ?? "",
            attachment_urls : req.body['attachment_urls'] ?? [],
        }

        let result = await TaskServices.createTask(req.user.id,data);
        res.status(result.code).json({ code: httpCode.OK, message: result.message, data: result.data });
    }
}

//This Function Update existing Task
module.exports.updateTask = async function (req, res) {
    const {  owners, labels,tags,reporter_id} = req.body;
    let updateData = {};

    if (req.body['id'] == '' || req.body['id'] == null)
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Task/Issue ID field is required." });

    else if (! await TaskModel.checkTaskExists(req.body['id']))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Task/Issue ID." });

    else if (owners != undefined && (!Array.isArray(owners) || owners.some(item => typeof item !== 'string')))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Owners. It must be an array of strings." });

    else if (req.body['duration'] != undefined && typeof req.body['duration'] != "object")
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Task duration." });

    else if (tags != undefined && (!Array.isArray(tags) || tags.some(item => typeof item !== 'string')))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Tags. It must be an array of strings." });

    else if (req.body['attachment_urls'] != undefined && (!Array.isArray(req.body['attachment_urls']) || req.body['attachment_urls'].some(item => typeof item !== 'string')))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Attachment URLs. It must be an array of strings." });

    else if (req.body['priority'] != undefined && req.body['priority'] != '' && !['', 'High', 'Medium', 'Low'].includes(req.body['priority']))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Project priority, Allowed values are ['','High','Medium','Low']." });

    else if (req.body['task_status'] != undefined && req.body['task_status'] != '' && !Config.TASK_STATUS.includes(req.body['task_status']))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": `Invalid Task Status, Allowed values are [${Config.TASK_STATUS}].` });

    else if (req.body['start_date'] !== undefined && req.body['start_date'] !== "" && (!Number.isInteger(Number(req.body['start_date'])) || Number(req.body['start_date']) <= 0))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Invalid Start Date. It must be a valid epoch timestamp."});

    else if (req.body['due_date'] !== undefined && req.body['due_date'] !== "" && (!Number.isInteger(Number(req.body['due_date'])) || Number(req.body['due_date']) <= 0))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: "Invalid Due Date. It must be a valid epoch timestamp."});

    else if (labels && (!Array.isArray(labels) || labels.some(item => typeof item !== 'string')))
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": `Invalid Label. Allowed values are [${Config.TASK_TYPES}]` });
    else {
        if (req.body['status'] || req.body['status'] == 0) {
            if (typeof req.body['status'] == "number" && [1, 0].includes(req.body['status']))
                updateData.status = req.body['status'];
            else
                return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Task Status, Allowed values are [0,1]." });
        }
        if (req.body['complete_per'] != undefined && req.body['complete_per'] != "") {
            if (req.body['complete_per'] > 100 || req.body['complete_per'] < 0)
                return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Task Completed persentage, Allowed values are [0-100]." });
            else
                updateData.complete_per = req.body['complete_per'];
        }
        let duration = [];
        if (req.body['duration'] != undefined && req.body['duration'] != "") {
            duration = req.body['duration'];
            if (!duration.unit || !duration.value || typeof duration.unit != "string" || typeof duration.value != "number")
                return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Task Duration field structure." });
            else if (duration.unit.toLowerCase() == 'days' || duration.unit.toLowerCase() == 'hours'){
                duration.unit = duration.unit.toLowerCase();
                updateData.duration = duration;
            }
            else
                return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Task Duration Unit, Allowed values are [Days,Hours]." });
        }
        if(reporter_id!=undefined && reporter_id!='')
            updateData.reporter = reporter_id;
        
        if (tags)
            updateData.tags = tags;
        if (req.body['attachment_urls'])
            updateData.attachment_urls = req.body['attachment_urls'];
        if (req.body['priority'])
            updateData.priority = req.body['priority'];
        if(req.body['start_date'])
            updateData.start_date = req.body['start_date'];
        if(req.body['due_date'])
            updateData.due_date = req.body['due_date'];
        if (req.body['task_status'])
            updateData.task_status = req.body['task_status'];
        if(labels)
            updateData.labels = labels;
        if(req.body['task_name'])
            updateData.task_name = req.body['task_name'];
        if(req.body['task_desc'])
            updateData.task_desc = req.body['task_desc'];
        updateData.updated = Math.floor(Date.now() / 1000);
        let result = await TaskServices.updateTask(req.user.id,req.body['id'],updateData);
        res.status(result.code).json({ code: result.code, message: result.message, data: result.data })
    }


}

//This function return all task status
module.exports.getTaskStatus = async function (req, res) {
    let status = Config.TASK_STATUS;
    res.json({
        code: httpCode.OK,
        message: "Task Sttaus Listing.",
        data: status
    });
    // let status = await TaskStatusModel.find({dept_ids:{$in:['664f4bd79f34d2c4f30c3fec','664f4bf23a39b5b9ff8f92a2','665038b339d48ca39bfdc47d','661253f489a31fa6c29b6c11']}})
    // .populate({'path':'dept_ids','select':'department','model':'Department',
    // match:{'added_by':'661253f489a31fa6c29b6c11'},
    // options:{sort:{"department":-1},limit:5}
    // }).populate({path:'added_by',select:'f_name l_name email phone'})
    // // .populate('dept_ids').exec();
    // res.json({
    //     code: httpCode.OK,
    //     message:"Task Status.",
    //     data:status
    // })
}

//Get Tasks by Filter
module.exports.getTaskList = async function (req, res) {
    let list_type = req.body['list_type'] ?? '';
    let project_ids = await ProjectModel.find({ project_owners: req.user.id }).select({ "_id": 1, "company_id": 1 });
    let allowProjectIds = [];
    project_ids.map((value) => {
        allowProjectIds.push(value._id);
    });
    var filter = { status: 1, project_id: { "$in": allowProjectIds } };
    if (req.body['owners'] != undefined && req.body['duration'] != "")
        filter.owners = { "$in": req.body['owners'] };
    if (req.body['tags'] != undefined && req.body['tags'] != "")
        filter.tags = { "$in": req.body['tags'] };
    if (req.body['task_id'] != undefined && req.body['task_id'] != "")
        filter.task_id = req.body['task_id'];
    if (req.body['id'] != undefined && req.body['id'] != "")
        filter._id = req.body['id'];
    if (req.body['project_id'] != undefined && req.body['project_id'] != "")
        filter.project_id = req.body['project_id'];
    if (req.body['added_by'] != undefined && req.body['added_by'] != "")
        filter.added_by = req.body['added_by'];
    if (req.body['task_status'] != undefined && req.body['task_status'] != "")
        filter.task_status = req.body['task_status'];
    if (req.body['priority'] != undefined && req.body['priority'] != "")
        filter.priority = req.body['priority'];
    if (req.body['task_name'] != undefined && req.body['task_name'] != "")
        filter.task_name = { $regex: req.body['task_name'], $options: 'i' }
    // console.log(filter)
    let tasks = [];
    try {
        tasks = await TaskModel.find(filter)
            .populate({ path: "project_id", select: "_id project_name" })
            .populate({ path: "added_by", select: '_id f_name l_name' })
            .populate({ path: "owners", select: "f_name l_name" }).sort({ "_id": -1 }).lean();

        let groupedTasks = {};
        let all_task_status = Config.TASK_STATUS;
        // groupedTasks[`${status}`] = [];
        all_task_status.forEach(status => {
            if (groupedTasks[`${status}`] == null)
                groupedTasks[`${status}`] = { "title": status.toUpperCase(), "tasks": [] };
        });

        var results = tasks.map(task => {
            task.project_info = task.project_id;
            delete task.project_id;
            //For Kanban List
            if (list_type.toLowerCase() == 'kanban') {
                // groupedTasks[task.task_status].push(task);
                groupedTasks[task.task_status].tasks.push(task)
            }
            return task;
        });
        if (list_type.toLowerCase() == 'kanban')
            results = groupedTasks;

        res.status(httpCode.OK).json({ code: httpCode.OK, message: "Tasks Listing.", data: results });
    } catch (error) {
        res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, message: error.message });
    }
}
//Get Singal Task 
module.exports.getSingalTask = async function (req, res) {
    let task_id = req.params['task_id'] ?? '';
    if (task_id == '' || task_id == null)
        return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Task ID field is required." });
    else {
        let data = await TaskModel.getFullTaskInfo(task_id);
        if (data)
            res.status(httpCode.OK).json({ code: httpCode.OK, message: "Tasks Details.", data: data });
        else
            return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Invalid Task ID." });
    }
}
