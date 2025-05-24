const MQ = require("../../config/rabbitmq.config");
const PanelLog = require("../../models/userAPIs/panel_log.model");
const UsersModel = require("../../models/userAPIs/users.model");
module.exports.sendLocalQueue = async function (message) {
    let queue = "M1_LOCAL_QUEUE";
    message = JSON.stringify(message);
    let connection = await MQ.start();
    const channel = await connection.createChannel();

    await channel.assertQueue(queue, { durable: false });
    channel.sendToQueue(queue, Buffer.from(message));

    console.log(`[x] Sent data to '${queue}'`);
    // Close the channel
    await channel.close();
    // Close the connection
    await connection.close();
    // Call Queue to Lister Events 
    await this.receiveMessage(queue);
    return true;
}
module.exports.receiveMessage = async function (queue) {
    let connection = await MQ.start();
    const channel = await connection.createChannel();

    await channel.assertQueue(queue, { durable: false });
    console.log(`[*] Waiting for messages in ${queue}. To exit, press CTRL+C`);

    channel.consume(queue, async (msg) => {
        const response = msg.content.toString();
        let result = JSON.parse(response);
        console.log(`Receive request from '${queue}'`)
        let responseMessage = '';
        switch (result.event) {
            case "LOG":
                await PanelLog.createLog(result.data);
                break;
            default:
                responseMessage = "Default Case Running user.js";
                break;
        }
        console.log(responseMessage);
    }, { noAck: true });
}

// This Function Send Message to another Microservice And get response from destination Microservice 
module.exports.sendAndReceiveMessage = async function (send_queue_name, receive_queue_name, request) {
    // This Code Send Message to Queue 
    request = JSON.stringify(request);
    let connection = await MQ.start();
    const channel = await connection.createChannel();
    await channel.assertQueue(send_queue_name, { durable: false });
    channel.sendToQueue(send_queue_name, Buffer.from(request));
    console.log(`[x] Sent '${request}' from '${send_queue_name}'`);
    //Message getting code 

    await channel.assertQueue(receive_queue_name, { durable: false });
    // console.log(`[*] Waiting for messages in ${receive_queue_name}. To exit, press CTRL+C`);
    const message = await new Promise((resolve, reject) => {
        channel.consume(receive_queue_name, (msg) => {
            try {
                const message = msg.content.toString();
                console.info(`Receive request ${message} from '${receive_queue_name}'`)
                resolve(message);
            } catch (error) {
                reject(error);
            }
        }, { noAck: true });
    })
    // Close the channel
    await channel.close();
    // Close the connection
    await connection.close();
    return message;

}

module.exports.receiveAndSendMessage = async function (receive_queue_name, send_queue_name) {
    let connection = await MQ.start();
    const channel = await connection.createChannel();

    await channel.assertQueue(receive_queue_name, { durable: false });
    await channel.assertQueue(send_queue_name, { durable: false });

    console.log(`[*] Waiting for messages in ${receive_queue_name}. To exit, press CTRL+C`);

    channel.consume(receive_queue_name, async (msg) => {
        const response = msg.content.toString();
        let result = JSON.parse(response);
        console.log(`Receive request ${response} from '${receive_queue_name}'`)
        let responseMessage = '';
        switch (result.type) {
            case "STUDENT_INFO":
                responseMessage = "Student info case 1 user.js";
                break;
            case "TEACHER_INFO":
                responseMessage = "Teacher info case 2 user.js";
                break;
            case "CHECK_USER_EXISTS":
                responseMessage = await UsersModel.checkUserExists(result.data);
                break;
            default:
                responseMessage = "Default Case Running user.js";
                break;
        }
        responseMessage = JSON.stringify({ 'resp': responseMessage });
        setTimeout(() => {
            channel.sendToQueue(send_queue_name, Buffer.from(responseMessage));
            console.log(`[x] Sent response: '${responseMessage}'`);
        }, 0); // 1000 milliseconds = 1 seconds
    }, { noAck: true });
}