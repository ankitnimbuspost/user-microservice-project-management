const express = require("express");
const route = express.Router();

const AdminController = require("../../controllers/adminAPIs/dashboard.controller");

route.get("/test",AdminController.dashboard);

module.exports = route;