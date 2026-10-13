import SavedOpportunity from "../models/SavedOpportunity.js";
import Opportunity from "../models/Opportunity.js";
import { calculateMatch } from "../utils/matchingService.js";
import { formatErrorResponse } from "../utils/errorHandler.js";

/**
 * POST /api/saved-opportunities
 * Save (bookmark) an opportunity.
 */
export const saveOpportunity = async (req, res) => {
  try {
    const { opportunityId } = req.body;
    if (!opportunityId) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "opportunityId is required." },
      });
    }

    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Opportunity not found." },
      });
    }

    // Upsert to ensure idempotency (saving an already saved item is a no-op)
    await SavedOpportunity.updateOne(
      { userId: req.user._id, opportunityId },
      { $setOnInsert: { userId: req.user._id, opportunityId } },
      { upsert: true }
    );

    return res.status(201).json({
      success: true,
      message: "Opportunity saved successfully.",
    });
  } catch (error) {
    console.error("Save opportunity error:", error);
    const { status: statusCode, body } = formatErrorResponse(error, "Failed to save opportunity.");
    return res.status(statusCode).json(body);
  }
};

/**
 * DELETE /api/saved-opportunities/:opportunityId
 * Remove a bookmark by opportunityId.
 */
export const unsaveOpportunity = async (req, res) => {
  try {
    const { opportunityId } = req.params;

    await SavedOpportunity.deleteOne({
      userId: req.user._id,
      opportunityId,
    });

    return res.status(200).json({
      success: true,
      message: "Opportunity removed from saved list.",
    });
  } catch (error) {
    console.error("Unsave opportunity error:", error);
    const { status: statusCode, body } = formatErrorResponse(error, "Failed to unsave opportunity.");
    return res.status(statusCode).json(body);
  }
};

/**
 * GET /api/saved-opportunities
 * Returns all saved opportunities for the authenticated user, populated and enriched with match scores.
 */
export const getSavedOpportunities = async (req, res) => {
  try {
    const saved = await SavedOpportunity.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "opportunityId",
        populate: [
          { path: "categoryId", select: "name slug" },
          { path: "skillIds", select: "name normalizedName" },
          { path: "fieldIds", select: "name slug" },
        ],
      })
      .lean();

    // Filter out orphaned bookmarks (in case an opportunity was removed)
    const validSaved = saved.filter((item) => item.opportunityId !== null);

    // Enrich with match scores if student has a profile
    const enriched = validSaved.map((item) => {
      const opp = item.opportunityId;
      if (req.user?.profile && opp) {
        opp.match = calculateMatch(req.user.profile, opp);
      }
      return item;
    });

    return res.status(200).json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    console.error("Get saved opportunities error:", error);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch saved opportunities." },
    });
  }
};

/**
 * GET /api/saved-opportunities/ids
 * Returns an array of saved opportunityId strings for O(1) status lookup on the frontend.
 */
export const getSavedOpportunityIds = async (req, res) => {
  try {
    const saved = await SavedOpportunity.find({ userId: req.user._id })
      .select("opportunityId")
      .lean();

    const ids = saved.map((item) => item.opportunityId.toString());

    return res.status(200).json({
      success: true,
      data: ids,
    });
  } catch (error) {
    console.error("Get saved IDs error:", error);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch saved opportunity IDs." },
    });
  }
};
