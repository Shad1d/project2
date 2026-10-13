import mongoose from "mongoose";
import {
  OPPORTUNITY_STATUSES,
  DEADLINE_STATUSES,
  VERIFICATION_STATUSES,
  SOURCE_TYPES,
  APPLICATION_EFFORTS,
  REMOTE_TYPES,
  EDUCATION_LEVELS,
  EXPERIENCE_LEVELS,
  FUNDING_TYPES,
} from "../config/constants.js";
import { normalizeUrl } from "../utils/normalizeUrl.js";
import { normalizeKey } from "../utils/normalizeKey.js";

export const NO_DEADLINE_SORT_KEY = new Date("9999-12-31T00:00:00.000Z");

const opportunitySchema = new mongoose.Schema(
  {
    // ── Content Fields ────────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters long"],
      maxlength: [300, "Title cannot exceed 300 characters"],
    },
    organizationName: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
      minlength: [2, "Organization name must be at least 2 characters long"],
      maxlength: [200, "Organization name cannot exceed 200 characters"],
    },
    organizationLogoUrl: {
      type: String,
      default: null,
      maxlength: 2048,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      minlength: [20, "Description must be at least 20 characters long"],
      maxlength: [10000, "Description cannot exceed 10,000 characters"],
    },
    applicationUrl: {
      type: String,
      required: [true, "Application URL is required"],
      maxlength: 2048,
    },
    sourceUrl: {
      type: String,
      default: null,
      maxlength: 2048,
    },
    sourceName: {
      type: String,
      default: null,
      maxlength: 200,
    },
    sourceType: {
      type: String,
      enum: [...SOURCE_TYPES, null],
      default: null,
    },
    country: {
      type: String,
      maxlength: 2,
      uppercase: true,
      default: null,
    },
    city: {
      type: String,
      maxlength: 100,
      default: null,
    },
    address: {
      type: String,
      maxlength: 300,
      default: null,
      trim: true,
    },
    // GeoJSON Point for geospatial queries (e.g. range filtering, nearest distance)
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
    remoteType: {
      type: String,
      enum: [...REMOTE_TYPES, null],
      default: null,
    },
    deadlineStatus: {
      type: String,
      required: [true, "Deadline status is required"],
      enum: DEADLINE_STATUSES,
    },
    deadline: {
      type: Date,
      default: null,
    },
    startDate: {
      type: String,
      default: null, // "YYYY-MM-DD"
    },
    endDate: {
      type: String,
      default: null, // "YYYY-MM-DD"
    },
    educationLevels: [
      {
        type: String,
        enum: EDUCATION_LEVELS,
      },
    ],
    educationRequirements: {
      type: String,
      maxlength: 2000,
      default: null,
    },
    experienceLevel: {
      type: String,
      enum: [...EXPERIENCE_LEVELS, null],
      default: null,
    },
    experienceRequirements: {
      type: String,
      maxlength: 2000,
      default: null,
    },
    eligibilityText: {
      type: String,
      maxlength: 5000,
      default: null,
    },
    applicationEffort: {
      type: String,
      enum: APPLICATION_EFFORTS,
      default: "UNKNOWN",
    },
    fundingType: {
      type: String,
      enum: FUNDING_TYPES,
      default: "UNKNOWN",
    },
    stipendAmount: {
      type: Number,
      default: null,
      min: 0,
    },
    salaryMin: {
      type: Number,
      default: null,
      min: 0,
    },
    salaryMax: {
      type: Number,
      default: null,
      min: 0,
    },
    currency: {
      type: String,
      maxlength: 3,
      uppercase: true,
      default: null,
    },
    benefits: {
      type: String,
      maxlength: 2000,
      default: null,
    },
    skillIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skill",
      },
    ],
    fieldIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Field",
      },
    ],

    // ── Server-Managed Lifecycle Fields ───────────────────────────────────────
    status: {
      type: String,
      enum: OPPORTUNITY_STATUSES,
      default: "DRAFT",
    },
    verificationStatus: {
      type: String,
      enum: VERIFICATION_STATUSES,
      default: "UNVERIFIED",
    },
    verificationNotes: {
      type: String,
      maxlength: 2000,
      default: null,
    },
    lastVerifiedAt: {
      type: Date,
      default: null,
    },
    verifiedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      maxlength: 1000,
      default: null,
    },
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastEditedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDemo: {
      type: Boolean,
      default: false,
    },

    // ── Derived Fields for Fast Search, Deduplication & Sorting ──────────────
    normalizedApplicationUrl: {
      type: String,
      required: true,
      unique: true,
    },
    deadlineSortKey: {
      type: Date,
      required: true,
    },
    organizationKey: {
      type: String,
      required: true,
    },
    titleKey: {
      type: String,
      required: true,
    },
    searchKeywords: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
opportunitySchema.index({ status: 1, publishedAt: -1 });
opportunitySchema.index({ deadlineSortKey: 1 });
opportunitySchema.index({ categoryId: 1 });
opportunitySchema.index({ deadline: 1 });
opportunitySchema.index({ country: 1 });
opportunitySchema.index({ organizationName: 1 });
opportunitySchema.index({ lastVerifiedAt: -1 });
opportunitySchema.index({ skillIds: 1 });
opportunitySchema.index({ fieldIds: 1 });
opportunitySchema.index({ organizationKey: 1, titleKey: 1 });
opportunitySchema.index({ location: "2dsphere" }); // Enables geospatial $geoWithin, $near, and $maxDistance queries

// Full-text search index
opportunitySchema.index(
  {
    title: "text",
    organizationName: "text",
    searchKeywords: "text",
    description: "text",
  },
  {
    name: "opportunities_text",
    weights: {
      title: 10,
      organizationName: 6,
      searchKeywords: 4,
      description: 1,
    },
    default_language: "english",
  }
);

/**
 * Helper to compute derived fields before save
 */
export function computeDerivedFields(input, names = { categoryName: "", skillNames: [], fieldNames: [] }) {
  const countryName = input.country
    ? new Intl.DisplayNames(["en"], { type: "region" }).of(input.country) ?? ""
    : "";

  return {
    normalizedApplicationUrl: normalizeUrl(input.applicationUrl),
    deadlineSortKey:
      input.deadlineStatus === "FIXED" && input.deadline
        ? new Date(input.deadline)
        : NO_DEADLINE_SORT_KEY,
    organizationKey: normalizeKey(input.organizationName),
    titleKey: normalizeKey(input.title),
    searchKeywords: [
      ...(names.skillNames || []),
      ...(names.fieldNames || []),
      input.city,
      input.address,
      input.country,
      countryName,
      names.categoryName,
    ]
      .filter(Boolean)
      .join(" "),
  };
}

const Opportunity = mongoose.model("Opportunity", opportunitySchema);
export default Opportunity;
