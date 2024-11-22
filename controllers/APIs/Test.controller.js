const MQService = require("../../services/RabbitMQ.service");
const mq_config = require("../../config/rabbitmq.config")
const httpCode = require("../../config/error.config");
const UsersModel = require("../../models/users.model");
const CompanyModel = require("../../models/company.model");
module.exports.test = async function (req, res) {
    let request = {
        type:"TEACHER_INFO",
        data:{
            "student_name":"Ankit Kr Thakur",
            "roll_no":"1"
        }
    };
    let data = await MQService.sendAndReceiveMessage(
        mq_config.config.SEND_MESSAGE_FROM_M1_TO_M2,
        mq_config.config.SEND_MESSAGE_FROM_M2_TO_M1,
        request
    );
    res.send(data);

}
module.exports.microRequestHandle = async function(req,res){
    let action = req.body['action'];
    let login_user = req.body['login_user'];
    if(!action || !login_user)
      return res.status(httpCode.BAD_REQUEST).json({ code: httpCode.BAD_REQUEST, "message": "Action & Login User is Required." });
    else
    {
        let data = req.body['data'] ?? {};
        let responseMessage = null;
        switch (action) {
            case "CHECK_USER_EXISTS":
                responseMessage = await UsersModel.checkUserExists(data);
                break;
            case "GET_USER_DETAILS":
                responseMessage = await UsersModel.findOne({_id:login_user});
                break;
            case "GET_TASK_ID":
                    responseMessage = await CompanyModel.getNewTaskID(login_user);
                break;
            default:
                responseMessage = {};
                break;
        }
        return res.status(httpCode.OK).json({ code: httpCode.OK, "message": "success",data:responseMessage });
    }
}