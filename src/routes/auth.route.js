const express = require('express');
const router = express();

const authController = require("../controllers/auth.controller")

// Ping route
router.get("/", authController.ping)

router.post("/signup", authController.signup)

router.post("/login",authController.login)

router.post("/verify", authController.verify)

router.post('/forgotPassword', authController.forgotPassword);

router.post("/resetpassword",  authController.resetPassword)

router.post("/resendverification", authController.resendVerification)

router.post("/logout", authController.Logout)

router.use(authController.protect);

router.post("/updatepassword",  authController.updatePassword)

module.exports = router;