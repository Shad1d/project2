import mongoose from "mongoose";

const savedOpportunitySchema = new mongoose.Schema(
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
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

// Prevent duplicate saves by the same user
savedOpportunitySchema.index({ userId: 1, opportunityId: 1 }, { unique: true });
savedOpportunitySchema.index({ userId: 1, createdAt: -1 });

const SavedOpportunity = mongoose.model("SavedOpportunity", savedOpportunitySchema);
export default SavedOpportunity;
