import express from "express";
import {
  saveOpportunity,
  unsaveOpportunity,
  getSavedOpportunities,
  getSavedOpportunityIds,
} from "../controllers/savedOpportunityController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All saved opportunity endpoints require authentication
router.use(protect);

router.get("/", getSavedOpportunities);
router.get("/ids", getSavedOpportunityIds);
router.post("/", saveOpportunity);
router.delete("/:opportunityId", unsaveOpportunity);

export default router;
