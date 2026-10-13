import express from "express";
import {
  getOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  getAdminOpportunitiesQueue,
} from "../controllers/opportunityController.js";
import { protect, optionalAuth, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes (with optional personalization for logged-in students)
router.get("/", optionalAuth, getOpportunities);
router.get("/admin/queue", protect, restrictTo("ADMIN", "MODERATOR"), getAdminOpportunitiesQueue);
router.get("/:id", optionalAuth, getOpportunityById);

// Admin / Moderator management routes
router.post("/", protect, restrictTo("ADMIN", "MODERATOR"), createOpportunity);
router.patch("/:id", protect, restrictTo("ADMIN", "MODERATOR"), updateOpportunity);
router.delete("/:id", protect, restrictTo("ADMIN"), deleteOpportunity);

export default router;
