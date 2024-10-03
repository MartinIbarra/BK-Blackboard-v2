const { Router } = require("express");
const authController = require("../controllers/authController");
const router = Router();

router.get("/", authController.home);
router.post("/", authController.oAuth);

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.get("/verifyuser", authController.verifyuser);

module.exports = router;
