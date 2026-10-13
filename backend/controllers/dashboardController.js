import Opportunity from "../models/Opportunity.js";
import Application from "../models/Application.js";
import SavedOpportunity from "../models/SavedOpportunity.js";
import { calculateMatch } from "../utils/matchingService.js";

/**
 * GET /api/dashboard
 * Aggregates student dashboard metrics, upcoming deadline timeline, and recommended matches.
 */
export const getStudentDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // 1. Fetch user's applications and saved opportunities in parallel
    const [applications, savedOpportunities] = await Promise.all([
      Application.find({ userId })
        .populate({
          path: "opportunityId",
          populate: [
            { path: "categoryId", select: "name slug" },
            { path: "skillIds", select: "name normalizedName" },
            { path: "fieldIds", select: "name slug" },
          ],
        })
        .lean(),
      SavedOpportunity.find({ userId })
        .populate({
          path: "opportunityId",
          populate: [
            { path: "categoryId", select: "name slug" },
            { path: "skillIds", select: "name normalizedName" },
            { path: "fieldIds", select: "name slug" },
          ],
        })
        .lean(),
    ]);

    // Filter valid (non-null) opportunities
    const validApps = applications.filter((a) => a.opportunityId !== null);
    const validSaved = savedOpportunities.filter((s) => s.opportunityId !== null);

    // 2. Application Stage Counts
    const stageCounts = {
      TOTAL: validApps.length,
      INTERESTED: 0,
      APPLIED: 0,
      INTERVIEW: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
    };
    validApps.forEach((app) => {
      if (stageCounts[app.status] !== undefined) {
        stageCounts[app.status]++;
      }
    });

    // 3. Collect all unique tracked opportunities (both saved and applied)
    const trackedOppsMap = new Map();

    validSaved.forEach((s) => {
      const opp = s.opportunityId;
      trackedOppsMap.set(opp._id.toString(), {
        opportunity: opp,
        isSaved: true,
        applicationStatus: null,
      });
    });

    validApps.forEach((a) => {
      const opp = a.opportunityId;
      const key = opp._id.toString();
      const existing = trackedOppsMap.get(key);
      if (existing) {
        existing.applicationStatus = a.status;
        existing.applicationId = a._id;
      } else {
        trackedOppsMap.set(key, {
          opportunity: opp,
          isSaved: false,
          applicationStatus: a.status,
          applicationId: a._id,
        });
      }
    });

    // 4. Categorize deadlines into timeline buckets
    const timeline = {
      urgent: [], // <= 7 days
      thisMonth: [], // 8 - 30 days
      later: [], // > 30 days
      rolling: [], // OPEN_UNTIL_FILLED / NO_DEADLINE
    };

    const oneDayMs = 24 * 60 * 60 * 1000;

    trackedOppsMap.forEach(({ opportunity, isSaved, applicationStatus, applicationId }) => {
      // Calculate match score if student has profile
      const oppWithMatch = { ...opportunity };
      if (req.user?.profile) {
        oppWithMatch.match = calculateMatch(req.user.profile, opportunity);
      }

      const item = {
        opportunity: oppWithMatch,
        isSaved,
        applicationStatus,
        applicationId,
      };

      if (opportunity.deadlineStatus !== "FIXED" || !opportunity.deadline) {
        timeline.rolling.push(item);
        return;
      }

      const deadlineDate = new Date(opportunity.deadline);
      const diffMs = deadlineDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / oneDayMs);

      item.daysLeft = daysLeft;

      if (daysLeft < 0) {
        // Deadline has passed
        return;
      }

      if (daysLeft <= 7) {
        timeline.urgent.push(item);
      } else if (daysLeft <= 30) {
        timeline.thisMonth.push(item);
      } else {
        timeline.later.push(item);
      }
    });

    // Sort buckets chronologically
    const sortByDeadline = (a, b) =>
      new Date(a.opportunity.deadline) - new Date(b.opportunity.deadline);
    timeline.urgent.sort(sortByDeadline);
    timeline.thisMonth.sort(sortByDeadline);
    timeline.later.sort(sortByDeadline);

    // 5. Recommended Top Matches (excluding already tracked listings)
    const trackedIds = new Set(trackedOppsMap.keys());
    const publicOpps = await Opportunity.find({
      status: "PUBLISHED",
      _id: { $nin: Array.from(trackedIds) },
    })
      .populate("categoryId", "name slug")
      .populate("skillIds", "name normalizedName")
      .populate("fieldIds", "name slug")
      .limit(20)
      .lean();

    let recommendations = [];
    if (req.user?.profile) {
      recommendations = publicOpps
        .map((opp) => ({
          ...opp,
          match: calculateMatch(req.user.profile, opp),
        }))
        .filter((opp) => (opp.match?.score || 0) >= 40)
        .sort((a, b) => (b.match?.score || 0) - (a.match?.score || 0))
        .slice(0, 4);
    } else {
      recommendations = publicOpps.slice(0, 4);
    }

    return res.status(200).json({
      success: true,
      data: {
        stageCounts,
        savedCount: validSaved.length,
        urgentCount: timeline.urgent.length,
        timeline,
        recommendations,
      },
    });
  } catch (error) {
    console.error("Get dashboard error:", error);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to load student dashboard." },
    });
  }
};
