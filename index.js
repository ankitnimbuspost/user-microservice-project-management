const express = require("express");
const http = require("http");
require("dotenv").config();
require("./config/database.config");
require("./config/rabbitmq.config");
const QueueController = require("./controllers/APIs/queue.controller")
const initUserSocket = require("./socket/UserSockets")
const apiRoutes = require("./routes/api.route");
const adminRoutes = require("./routes/admin.route");
const app = express();
const server = http.createServer(app);
const cors = require('cors');
const fileUpload = require('express-fileupload');
const bodyParser = require("body-parser");
const { Server } = require("socket.io");

initUserSocket(server)

app.use(cors());
app.use(fileUpload());
app.use(express.json({ limit: '50mb' }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Serve static files (e.g., index.html)
app.use(express.static(__dirname + '/public'));
app.post("/api/test", function (req, res) {
  // req.body contains the other fields sent via form-data
  console.log(req.body['email']);
  console.log(req.files);
  res.send('Form data received.');
});
app.get("/queue-run", QueueController.startQueue);
app.use("/api", apiRoutes);
app.use("/admin", adminRoutes);


server.listen(process.env.PORT, function () {
    console.log(`Application running on ${process.env.PORT} PORT`);
});
