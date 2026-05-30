const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middleware/auth");
const {
  analyzeResume,
  getHistory,
  getAnalysis,
  deleteAnalysis,
} = require("../controllers/resumeController");

// Multer — store PDF in memory (max 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed."), false);
    }
  },
});

// All resume routes require login
router.use(protect);

router.post("/analyze", upload.single("file"), analyzeResume);
router.get("/history", getHistory);
router.get("/:id", getAnalysis);
router.delete("/:id", deleteAnalysis);

module.exports = router;
