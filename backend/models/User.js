import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import {
  USER_ROLES,
  EDUCATION_LEVELS,
  EXPERIENCE_LEVELS,
  REMOTE_PREFERENCES,
} from "../config/constants.js";

const profileSchema = new mongoose.Schema(
  {
    educationLevel: {
      type: String,
      enum: [...EDUCATION_LEVELS, null],
      default: null,
    },
    major: {
      type: String,
      maxlength: 100,
      default: null,
      trim: true,
    },
    majorFieldId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Field",
      default: null,
    },
    university: {
      type: String,
      maxlength: 150,
      default: null,
      trim: true,
    },
    graduationYear: {
      type: Number,
      default: null,
    },
    country: {
      type: String,
      maxlength: 2,
      uppercase: true,
      default: null,
    },
    address: {
      type: String,
      maxlength: 300,
      default: null,
      trim: true,
    },
    // GeoJSON Point representing student home or campus base
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
    experienceLevel: {
      type: String,
      enum: [...EXPERIENCE_LEVELS, null],
      default: null,
    },
    remotePreference: {
      type: String,
      enum: REMOTE_PREFERENCES,
      default: "ANY",
    },
    skillIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skill",
      },
    ],
    interestFieldIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Field",
      },
    ],
    preferredCategoryIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    preferredLocations: [
      {
        _id: false,
        country: { type: String, required: true, uppercase: true },
        city: { type: String, maxlength: 100, default: null },
      },
    ],
    profilePicture: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "USER",
    },
    displayName: {
      type: String,
      required: [true, "Display name is required"],
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    profile: {
      type: profileSchema,
      default: () => ({}),
    },
    notificationPreferences: {
      deadlineRemindersEnabled: {
        type: Boolean,
        default: true,
      },
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Hash password before saving if modified
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password candidate
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Safe DTO representation without password
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    email: this.email,
    displayName: this.displayName,
    role: this.role,
    timezone: this.timezone,
    profile: this.profile,
    notificationPreferences: this.notificationPreferences,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model("User", userSchema);
export default User;
