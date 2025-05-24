const express = require("express");
const route = express.Router();
const APIMiddleware = require("../../middleware/api.middleware");
const AuthController = require("../../controllers/userAPIs/auth.controller");
const TestController = require("../../controllers/userAPIs/Test.controller");
const UserController = require("../../controllers/userAPIs/user.controller")
const KycController = require('../../controllers/userAPIs/kyc.controller');


route.use("/",APIMiddleware.checkJWTToken);


route.post("/signup",AuthController.signup);
route.post("/signin",AuthController.signin);
route.get("/logout",AuthController.logout);
route.get("/user",AuthController.userDetails);
route.post("/update-profile",AuthController.updateUserProfile);
route.post('/forgot-password',AuthController.forgotPassword);
route.post('/update-password',AuthController.updatePassword);

route.get("/test",TestController.test);
route.post("/user-company-wise",UserController.getUserCompanyWise);
route.post("/create-update-pricing-plan",UserController.createUpdatePricingPlan)
route.post('/update-company-details',KycController.addUpdateKyc);
route.post("/share-invitation",UserController.shareInvitation);
route.post("/upload-files",KycController.uploadFiles);
route.post("/micro1-request-internal",TestController.microRequestHandle)
route.post("/set-direct-user-message",UserController.setDirectMessageUser)

module.exports = route;