import express from "express";
import {
  createOrUpdateApplication,
  getApplications,
  updateApplication,
  deleteApplication,
} from "../controllers/applicationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All application tracking routes require authentication
router.use(protect);

router.get("/", getApplications);
router.post("/", createOrUpdateApplication);
router.patch("/:id", updateApplication);
router.delete("/:id", deleteApplication);

export default router;
