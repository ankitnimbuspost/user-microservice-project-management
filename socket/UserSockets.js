const SocketIo = require("socket.io");
const Middleware = require("../middleware/socket.middleware");
const ChatHelper = require("./ChatHelper");
const { decode } = require("jsonwebtoken");
const UserSettings = require("../models/users.settings.model");




let users = {};
function initUserSocket(server) {
    // const io = SocketIo(server);
    const io = new SocketIo.Server(server, {
        cors: {
            origin: "*", // Allow React client
            methods: ["GET", "POST"]
        }
    });
    io.use((socket, next) => Middleware.authenticateUsers(socket, next))
    io.on("connection", async (socket) => {
        // Add Active User 
        users[socket.decoded.id] = socket.id;
        ChatHelper.setUserSession(socket.decoded.id, socket.id)
        console.log(`New User connected with Socket ID: ${socket.id}`);

        // ******************One by one Message (Private Message Start)***********************
        socket.on('private_message', async (request) => {

            ChatHelper.savePrivateMessage(socket.decoded.id, request).then((data) => {
                const sender_socket_id = users[request.send_to];
                // Send Message to Current User 
                const current_user_socket_id = users[socket.decoded.id];
                io.to(current_user_socket_id).emit('private_message', { response: data });
                if (sender_socket_id) {
                    // Send Message to Receiver Socket User
                    io.to(sender_socket_id).emit('private_message', { response: data });
                }
            }).catch((error) => { console.log(error) });

        });

        // ************************** End***************************************

        //*********************Message Seen Events********************** 
        socket.on('private_message_seen', async (request) => {
            //Here Seen Message:- receiver_id = > current_user_id & sender_id=>who is send message to you
            const sender_socket_id = users[request.sender_id];
            await ChatHelper.seenPrivateMessage(socket.decoded.id, request.sender_id);
            if (sender_socket_id) {
                let messageLists = await ChatHelper.getPrivateMessageList(socket.decoded.id, request.sender_id);
                io.to(sender_socket_id).emit('private_message_list', { "messages": messageLists });
            }
        });
        //*****************************End ***************************

        //************************Private Message Listing************************ */
        socket.on('private_message_list', async (request) => {
            //Sender ID like target id (Kinka Message dekhna hai apne session se)
            //Here Seen Message:- receiver_id = > current_user_id & sender_id=>who is send message to you
            const sender_socket_id = users[socket.decoded.id];
            if (sender_socket_id) {
                let messageLists = await ChatHelper.getPrivateMessageList(socket.decoded.id, request.sender_id);
                // console.log(messageLists)
                // io.to(sender_socket_id).emit('private_message_list', { "messages": messageLists });
                socket.emit('private_message_list', { "messages": messageLists });
            }
        });
        //********************************End********************** */

        //************************User Group Details Listing************************ */
        socket.on('get_to_data', async (request) => {
            // Request Eg: {id:"1223322","type":"user"}
            try {
                let details = await ChatHelper.getUserGroupDetails(request.id, request.type);
                let data = {last_used_user:{"type":request.type.toLowerCase(),"id":request.id}};
                UserSettings.updateSetting(socket.decoded.id,data).then(data).catch((err)=>{
                    console.log(err.message);
                });
                socket.emit('get_to_data', { "data": details });
            } catch (error) {
                console.error(error.message);
            }

        });
        //********************************End********************** */

        //****************************My Contact List Users ********************************** */
        socket.on("my_contact_list", async (request) => {
            let current_user = socket.decoded.id;

        });
        //********************************End********************** */

        /*--------------Broadcasting Events --------------------------*/
        let userData = await ChatHelper.getDirectMessageUser(socket.decoded.id);
        io.emit("getDirectMessageUser", { "data": userData });
        let userGroups = await ChatHelper.getUserGroups(socket.decoded.id);
        // console.log(userGroups)
        io.emit("getUserGroups", { "data": userGroups });

        //----------------------End ----------------------------------------------/
        socket.on("disconnect", () => {
            // Remove the user from the users object
            for (let userId in users) {
                if (users[userId] === socket.id) {
                    delete users[userId];
                    break;
                }
            }
            ChatHelper.unsetUserSession(socket.decoded.id)
            console.log(`User disconnected with Socket ID: ${socket.id}`);
        });
    });
}

module.exports = initUserSocket;