import express from "express";
import {
  register,
  login,
  getMe,
  updateProfile,
  uploadAvatar,
  uploadProfilePicture,
  removeProfilePicture,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.post("/profile/picture", protect, uploadAvatar.single("picture"), uploadProfilePicture);
router.delete("/profile/picture", protect, removeProfilePicture);

export default router;
