const amqp = require('amqplib');
const MQService = require("../../services/userAPIs/RabbitMQ.service");
const config = require("../../config/rabbitmq.config")

module.exports.startQueue = async function (req, res) {
    await MQService.receiveAndSendMessage(
        config.config.SEND_MESSAGE_FROM_M2_TO_M1_REV,
        config.config.SEND_MESSAGE_FROM_M1_TO_M2_REV
    );
    res.send("Queue Started User Microservices");
}