import express from "express";
import {
  getCategories,
  getFields,
  getSkills,
} from "../controllers/vocabularyController.js";

const router = express.Router();

router.get("/categories", getCategories);
router.get("/fields", getFields);
router.get("/skills", getSkills);

export default router;
