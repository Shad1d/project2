import express from "express";
import {
  createReport,
  getReports,
  resolveReport,
} from "../controllers/reportController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// Submitting reports requires authentication
router.post("/", protect, createReport);

// Moderator and Admin queues
router.get("/", protect, restrictTo("ADMIN", "MODERATOR"), getReports);
router.patch("/:id", protect, restrictTo("ADMIN", "MODERATOR"), resolveReport);

export default router;
