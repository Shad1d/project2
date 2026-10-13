import jwt from "jsonwebtoken";
import path from "path";
import multer from "multer";
import User from "../models/User.js";
import { formatErrorResponse } from "../utils/errorHandler.js";
import { supabase, BUCKET_NAME } from "../config/supabase.js";

// Multer memory storage for direct cloud upload to Supabase
const storage = multer.memoryStorage();
const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, WEBP and GIF images are allowed"), false);
  }
};

export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

/**
 * Signs a JWT session token for the user.
 */
const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

/**
 * POST /api/auth/register
 * Creates a student account and returns token.
 */
export const register = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Email, password, and display name are required." },
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Password must be at least 8 characters long." },
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: { code: "EMAIL_ALREADY_REGISTERED", message: "Email is already registered." },
      });
    }

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password,
      displayName: displayName.trim(),
    });

    const token = signToken(user._id);

    return res.status(201).json({
      success: true,
      message: "Account created successfully!",
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("Register error:", error);
    const { status: statusCode, body } = formatErrorResponse(error, "Registration failed. Please try again.");
    return res.status(statusCode).json(body);
  }
};

/**
 * POST /api/auth/login
 * Validates credentials and returns JWT token.
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Please provide email and password." },
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." },
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Signed in successfully!",
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Login failed. Please try again." },
    });
  }
};

/**
 * GET /api/auth/me
 * Returns currently authenticated user.
 */
export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user.toSafeObject(),
  });
};

/**
 * PUT /api/profile
 * Updates student profile details.
 */
export const updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      "educationLevel",
      "major",
      "majorFieldId",
      "university",
      "graduationYear",
      "country",
      "address",
      "experienceLevel",
      "remotePreference",
      "skillIds",
      "interestFieldIds",
      "preferredCategoryIds",
      "preferredLocations",
      "profilePicture",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[`profile.${field}`] = req.body[field];
      }
    }

    // Support location as either GeoJSON { type: 'Point', coordinates: [lng, lat] } or simple { lat, lng }
    if (req.body.location !== undefined) {
      if (req.body.location === null) {
        updates["profile.location"] = null;
      } else if (
        Array.isArray(req.body.location.coordinates) &&
        req.body.location.coordinates.length === 2
      ) {
        updates["profile.location"] = {
          type: "Point",
          coordinates: [
            Number(req.body.location.coordinates[0]),
            Number(req.body.location.coordinates[1]),
          ],
        };
      } else if (
        req.body.location.lat !== undefined &&
        req.body.location.lng !== undefined
      ) {
        updates["profile.location"] = {
          type: "Point",
          coordinates: [
            Number(req.body.location.lng),
            Number(req.body.location.lat),
          ],
        };
      }
    }

    if (req.body.displayName) {
      updates.displayName = req.body.displayName.trim();
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("Update profile error:", error);
    const { status: statusCode, body } = formatErrorResponse(error, "Failed to update profile.");
    return res.status(statusCode).json(body);
  }
};

/**
 * POST /api/auth/profile/picture
 * Uploads a profile picture to Supabase storage and saves the public URL to MongoDB.
 */
export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Please select an image file to upload." },
      });
    }

    const file = req.file;
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const uniqueName = `user-${req.user._id}-${Date.now()}${ext}`;
    const filePath = `avatars/${uniqueName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      return res.status(500).json({
        success: false,
        error: {
          code: "STORAGE_UPLOAD_ERROR",
          message: `Failed to upload profile picture to Supabase: ${uploadError.message}`,
        },
      });
    }

    // Retrieve public URL from Supabase
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData?.publicUrl;
    if (!publicUrl) {
      return res.status(500).json({
        success: false,
        error: { code: "STORAGE_ERROR", message: "Failed to generate public URL for uploaded photo." },
      });
    }

    // Cleanup previous profile picture from storage if it belonged to this bucket
    const oldPicture = req.user.profile?.profilePicture;
    if (oldPicture && oldPicture.includes(BUCKET_NAME)) {
      try {
        const oldPath = oldPicture.split(`${BUCKET_NAME}/`)[1];
        if (oldPath) {
          await supabase.storage.from(BUCKET_NAME).remove([oldPath]);
        }
      } catch (delErr) {
        console.warn("Could not delete previous profile picture:", delErr.message);
      }
    }

    // Save image link in MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { "profile.profilePicture": publicUrl } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully!",
      profilePicture: publicUrl,
      user: updatedUser.toSafeObject(),
    });
  } catch (error) {
    console.error("Profile picture upload error:", error);
    const { status: statusCode, body } = formatErrorResponse(
      error,
      "Failed to upload profile picture."
    );
    return res.status(statusCode).json(body);
  }
};

/**
 * DELETE /api/auth/profile/picture
 * Removes profile picture from Supabase storage and clears the link in MongoDB.
 */
export const removeProfilePicture = async (req, res) => {
  try {
    const oldPicture = req.user.profile?.profilePicture;
    if (oldPicture && oldPicture.includes(BUCKET_NAME)) {
      try {
        const oldPath = oldPicture.split(`${BUCKET_NAME}/`)[1];
        if (oldPath) {
          await supabase.storage.from(BUCKET_NAME).remove([oldPath]);
        }
      } catch (delErr) {
        console.warn("Could not delete previous profile picture from Supabase:", delErr.message);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { "profile.profilePicture": null } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Profile picture removed successfully!",
      user: updatedUser.toSafeObject(),
    });
  } catch (error) {
    console.error("Profile picture remove error:", error);
    const { status: statusCode, body } = formatErrorResponse(
      error,
      "Failed to remove profile picture."
    );
    return res.status(statusCode).json(body);
  }
};
