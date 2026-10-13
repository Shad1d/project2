import mongoose from "mongoose";
import { REPORT_REASONS, REPORT_STATUSES } from "../config/constants.js";

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    opportunityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Opportunity",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      enum: REPORT_REASONS,
    },
    description: {
      type: String,
      maxlength: 2000,
      default: null,
    },
    status: {
      type: String,
      enum: REPORT_STATUSES,
      default: "OPEN",
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolutionNote: {
      type: String,
      maxlength: 1000,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ opportunityId: 1, status: 1 });

const Report = mongoose.model("Report", reportSchema);
export default Report;
