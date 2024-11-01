const { Router } = require("express");
const authController = require("../../controllers/authController");
const router = Router();

router.post("/", authController.request);

module.exports = router;
