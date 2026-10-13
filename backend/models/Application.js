import mongoose from "mongoose";
import { APPLICATION_STATUSES } from "../config/constants.js";

const applicationSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: "INTERESTED",
    },
    notes: {
      type: String,
      maxlength: 5000,
      default: null,
    },
    appliedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// One application tracker entry per user per opportunity
applicationSchema.index({ userId: 1, opportunityId: 1 }, { unique: true });
applicationSchema.index({ userId: 1, status: 1 });

const Application = mongoose.model("Application", applicationSchema);
export default Application;
