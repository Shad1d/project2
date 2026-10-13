import express from "express";
import { getStudentDashboard } from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Student dashboard requires authentication
router.use(protect);

router.get("/", getStudentDashboard);

export default router;
