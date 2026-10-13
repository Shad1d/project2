import Report from "../models/Report.js";
import Opportunity from "../models/Opportunity.js";
import { REPORT_REASONS, REPORT_STATUSES } from "../config/constants.js";
import { formatErrorResponse } from "../utils/errorHandler.js";

/**
 * POST /api/reports
 * Submit a community report on an opportunity (e.g., expired deadline, broken link, or scam).
 */
export const createReport = async (req, res) => {
  try {
    const { opportunityId, reason, description = null } = req.body;

    if (!opportunityId) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "opportunityId is required." },
      });
    }

    if (!reason || !REPORT_REASONS.includes(reason)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: `Invalid reason. Must be one of: ${REPORT_REASONS.join(", ")}`,
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

    // Prevent duplicate open reports by the same student for the same listing
    const existingOpenReport = await Report.findOne({
      userId: req.user._id,
      opportunityId,
      status: "OPEN",
    });

    if (existingOpenReport) {
      return res.status(400).json({
        success: false,
        error: {
          code: "DUPLICATE_REPORT",
          message: "You have already reported this listing. Our team is actively reviewing it.",
        },
      });
    }

    const report = await Report.create({
      userId: req.user._id,
      opportunityId,
      reason,
      description: description ? description.trim() : null,
      status: "OPEN",
    });

    // Automated trust safeguard: If listing receives 3 or more open reports, auto-flag it
    const openReportsCount = await Report.countDocuments({
      opportunityId,
      status: "OPEN",
    });

    if (openReportsCount >= 3 && opportunity.verificationStatus !== "FLAGGED") {
      await Opportunity.findByIdAndUpdate(opportunityId, {
        verificationStatus: "FLAGGED",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Thank you for helping keep listings accurate. Your report has been submitted.",
      data: report,
    });
  } catch (error) {
    console.error("Create report error:", error);
    const { status: statusCode, body } = formatErrorResponse(error, "Failed to submit report.");
    return res.status(statusCode).json(body);
  }
};

/**
 * GET /api/reports
 * Fetch reports queue (Admin and Moderator only).
 */
export const getReports = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status && REPORT_STATUSES.includes(status.toUpperCase())) {
      filter.status = status.toUpperCase();
    }

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "displayName email role")
      .populate({
        path: "opportunityId",
        select: "title organizationName applicationUrl status verificationStatus",
      })
      .lean();

    return res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("Get reports error:", error);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch reports." },
    });
  }
};

/**
 * PATCH /api/reports/:id
 * Resolve or dismiss a report (Admin and Moderator only).
 */
export const resolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolutionNote, action } = req.body;

    if (!status || !["RESOLVED", "DISMISSED", "REVIEWING"].includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Status must be 'REVIEWING', 'RESOLVED', or 'DISMISSED'.",
        },
      });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Report not found." },
      });
    }

    report.status = status.toUpperCase();
    if (resolutionNote !== undefined) {
      report.resolutionNote = resolutionNote;
    }
    if (status.toUpperCase() === "RESOLVED" || status.toUpperCase() === "DISMISSED") {
      report.resolvedAt = new Date();
      report.resolvedByUserId = req.user._id;
    }

    // Optional moderator action to directly update opportunity
    if (action === "EXPIRE_OPPORTUNITY") {
      await Opportunity.findByIdAndUpdate(report.opportunityId, {
        status: "EXPIRED",
      });
    } else if (action === "FLAG_OPPORTUNITY") {
      await Opportunity.findByIdAndUpdate(report.opportunityId, {
        verificationStatus: "FLAGGED",
      });
    } else if (action === "UNFLAG_OPPORTUNITY") {
      await Opportunity.findByIdAndUpdate(report.opportunityId, {
        verificationStatus: "VERIFIED",
      });
    }

    await report.save();

    return res.status(200).json({
      success: true,
      message: `Report marked as ${report.status}.`,
      data: report,
    });
  } catch (error) {
    console.error("Resolve report error:", error);
    const { status: statusCode, body } = formatErrorResponse(error, "Failed to resolve report.");
    return res.status(statusCode).json(body);
  }
};
