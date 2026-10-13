import Application from "../models/Application.js";
import Opportunity from "../models/Opportunity.js";
import { APPLICATION_STATUSES } from "../config/constants.js";
import { formatErrorResponse } from "../utils/errorHandler.js";

/**
 * POST /api/applications
 * Create or update an application tracking entry for an opportunity.
 */
export const createOrUpdateApplication = async (req, res) => {
  try {
    const { opportunityId, status = "INTERESTED", notes = null, appliedAt = null } = req.body;

    if (!opportunityId) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "opportunityId is required." },
      });
    }

    if (!APPLICATION_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: `Invalid status. Must be one of: ${APPLICATION_STATUSES.join(", ")}`,
        },
      });
    }

    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Opportunity not found." },
      });
    }

    // Auto-set appliedAt if status is APPLIED and date not specified
    let finalAppliedAt = appliedAt;
    if (status === "APPLIED" && !finalAppliedAt) {
      finalAppliedAt = new Date();
    }

    // Check if tracker record already exists
    let application = await Application.findOne({
      userId: req.user._id,
      opportunityId,
    });

    if (application) {
      application.status = status;
      if (notes !== undefined) application.notes = notes;
      if (finalAppliedAt !== null) application.appliedAt = finalAppliedAt;
      await application.save();
    } else {
      application = await Application.create({
        userId: req.user._id,
        opportunityId,
        status,
        notes,
        appliedAt: finalAppliedAt,
      });
    }

    // Populate opportunity details before returning
    await application.populate({
      path: "opportunityId",
      populate: { path: "categoryId", select: "name slug" },
    });

    return res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error("Create/update application error:", error);
    const { status: statusCode, body } = formatErrorResponse(error, "Failed to record application.");
    return res.status(statusCode).json(body);
  }
};

/**
 * GET /api/applications
 * Returns all tracked applications for the authenticated user, optionally filtered by status.
 */
export const getApplications = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.user._id };

    if (status && APPLICATION_STATUSES.includes(status.toUpperCase())) {
      filter.status = status.toUpperCase();
    }

    const applications = await Application.find(filter)
      .sort({ updatedAt: -1 })
      .populate({
        path: "opportunityId",
        populate: [
          { path: "categoryId", select: "name slug" },
          { path: "skillIds", select: "name normalizedName" },
          { path: "fieldIds", select: "name slug" },
        ],
      })
      .lean();

    // Filter out any orphaned applications where listing was removed
    const validApplications = applications.filter((app) => app.opportunityId !== null);

    return res.status(200).json({
      success: true,
      data: validApplications,
    });
  } catch (error) {
    console.error("Get applications error:", error);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch applications." },
    });
  }
};

/**
 * PATCH /api/applications/:id
 * Update status, notes, or appliedAt date on a specific application tracker item.
 */
export const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, appliedAt } = req.body;

    const application = await Application.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Application record not found." },
      });
    }

    if (status) {
      if (!APPLICATION_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `Invalid status. Must be one of: ${APPLICATION_STATUSES.join(", ")}`,
          },
        });
      }
      application.status = status;

      // If transitioning to APPLIED and appliedAt was never set
      if (status === "APPLIED" && !application.appliedAt && !appliedAt) {
        application.appliedAt = new Date();
      }
    }

    if (notes !== undefined) {
      application.notes = notes;
    }

    if (appliedAt !== undefined) {
      application.appliedAt = appliedAt;
    }

    await application.save();
    await application.populate({
      path: "opportunityId",
      populate: { path: "categoryId", select: "name slug" },
    });

    return res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error("Update application error:", error);
    const { status: statusCode, body } = formatErrorResponse(error, "Failed to update application.");
    return res.status(statusCode).json(body);
  }
};

/**
 * DELETE /api/applications/:id
 * Remove an application tracker entry.
 */
export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Application.deleteOne({
      _id: id,
      userId: req.user._id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Application record not found." },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Application removed from tracker.",
    });
  } catch (error) {
    console.error("Delete application error:", error);
    const { status: statusCode, body } = formatErrorResponse(error, "Failed to delete application.");
    return res.status(statusCode).json(body);
  }
};
