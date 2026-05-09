const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadMiddleware");
const { uploadBill, splitBill, sendEmailReminders } = require("../controllers/billController");
const { analyzeBill } = require("../controllers/aiController");

router.post("/upload", upload.single("bill"), uploadBill);
router.post("/split", splitBill);
router.post("/analyze", analyzeBill);
router.post("/send-email", sendEmailReminders);

module.exports = router;