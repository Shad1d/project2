import Opportunity, { computeDerivedFields } from "../models/Opportunity.js";
import Category from "../models/Category.js";
import Field from "../models/Field.js";
import Skill from "../models/Skill.js";
import { calculateMatch, createMatcher } from "../utils/matchingService.js";
import { calculateDistanceKm } from "../utils/geoDistance.js";
import { formatErrorResponse } from "../utils/errorHandler.js";

/**
 * GET /api/opportunities
 * Public opportunity listing with search, filters, range selection, nearest sorting, and pagination.
 */
export const getOpportunities = async (req, res) => {
  try {
    const {
      search,
      category,
      country,
      remoteType,
      education,
      fundingType,
      lat,
      lng,
      maxDistance,
      sort = "newest",
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Base filter: Only PUBLISHED listings are publicly discoverable
    const filter = { status: "PUBLISHED" };

    // Resolve user location coordinates from query params or user profile
    let queryLat = lat !== undefined && lat !== "" && !isNaN(Number(lat)) ? Number(lat) : null;
    let queryLng = lng !== undefined && lng !== "" && !isNaN(Number(lng)) ? Number(lng) : null;

    if (
      queryLat === null &&
      queryLng === null &&
      Array.isArray(req.user?.profile?.location?.coordinates) &&
      req.user.profile.location.coordinates.length === 2
    ) {
      queryLng = Number(req.user.profile.location.coordinates[0]);
      queryLat = Number(req.user.profile.location.coordinates[1]);
    }

    // 1. Full-text search
    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    // 2. Category filter (by slug or ObjectId)
    if (category) {
      let catDoc = null;
      if (typeof category === "string" && category.match(/^[0-9a-fA-F]{24}$/)) {
        catDoc = await Category.findById(category);
      }
      if (!catDoc) {
        catDoc = await Category.findOne({ slug: category.toLowerCase().trim() });
      }
      if (catDoc) {
        filter.categoryId = catDoc._id;
      }
    }

    // 3. Country filter
    if (country) {
      filter.country = country.toUpperCase().trim();
    }

    // 4. Remote Type (REMOTE, HYBRID, ONSITE)
    if (remoteType) {
      filter.remoteType = remoteType.toUpperCase().trim();
    }

    // 5. Education Level (UNDERGRADUATE, HIGH_SCHOOL, etc.)
    if (education) {
      filter.educationLevels = education.toUpperCase().trim();
    }

    // 6. Funding Type (PAID, FULLY_FUNDED, etc.)
    if (fundingType) {
      filter.fundingType = fundingType.toUpperCase().trim();
    }

    // 7. Distance & Range filter ($geoWithin)
    const maxDistKm =
      maxDistance !== undefined && maxDistance !== "" && !isNaN(Number(maxDistance))
        ? Number(maxDistance)
        : null;

    if (maxDistKm && queryLat !== null && queryLng !== null) {
      const radiusInRadians = maxDistKm / 6378.1; // Earth mean radius ~6378.1 km
      if (remoteType === "REMOTE") {
        // Explicitly remote, no spatial filter
      } else {
        filter.location = {
          $geoWithin: {
            $centerSphere: [[queryLng, queryLat], radiusInRadians],
          },
        };
      }
    }

    // Sorting strategy
    let sortOptions = { publishedAt: -1 };
    if (sort === "deadline_soonest") {
      sortOptions = { deadlineSortKey: 1, publishedAt: -1 };
    } else if (sort === "recently_verified") {
      sortOptions = { lastVerifiedAt: -1, publishedAt: -1 };
    } else if (sort === "relevance" && filter.$text) {
      sortOptions = { score: { $meta: "textScore" } };
    }

    // Query execution & total count
    const [opportunities, total] = await Promise.all([
      Opportunity.find(filter)
        .populate("categoryId", "name slug")
        .populate("skillIds", "name normalizedName")
        .populate("fieldIds", "name slug")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Opportunity.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    // Attach distanceKm and personalized match scores
    const matcher = req.user?.profile ? createMatcher(req.user.profile) : null;
    let enriched = opportunities.map((opp) => {
      let itemDistanceKm = null;
      if (
        queryLat !== null &&
        queryLng !== null &&
        Array.isArray(opp.location?.coordinates) &&
        opp.location.coordinates.length === 2
      ) {
        itemDistanceKm = calculateDistanceKm(
          queryLat,
          queryLng,
          opp.location.coordinates[1],
          opp.location.coordinates[0]
        );
      }

      let matchData = null;
      if (matcher) {
        const matchResult = matcher(opp);
        matchData = {
          score: matchResult.score,
          label: matchResult.label,
        };
        // If distance was computed in matchResult, synchronize
        if (itemDistanceKm === null && matchResult.distanceKm !== null) {
          itemDistanceKm = matchResult.distanceKm;
        }
      }

      return {
        ...opp,
        distanceKm: itemDistanceKm,
        ...(matchData ? { match: matchData } : {}),
      };
    });

    // If student requested Best Match sorting, sort by match score descending
    if (sort === "best_match" && req.user?.profile) {
      enriched.sort((a, b) => (b.match?.score ?? -1) - (a.match?.score ?? -1));
    }

    // If student requested Nearest Distance sorting
    if (sort === "nearest" || sort === "distance") {
      enriched.sort((a, b) => {
        const distA =
          a.distanceKm !== null && a.distanceKm !== undefined ? a.distanceKm : Infinity;
        const distB =
          b.distanceKm !== null && b.distanceKm !== undefined ? b.distanceKm : Infinity;
        return distA - distB;
      });
    }

    return res.status(200).json({
      success: true,
      data: enriched,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
      activeLocation: queryLat !== null && queryLng !== null ? { lat: queryLat, lng: queryLng } : null,
    });
  } catch (error) {
    console.error("Get opportunities error:", error);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch opportunities." },
    });
  }
};

/**
 * GET /api/opportunities/:id
 * Fetches full details of a single opportunity.
 */
export const getOpportunityById = async (req, res) => {
  try {
    const { id } = req.params;

    const opportunity = await Opportunity.findById(id)
      .populate("categoryId", "name slug")
      .populate("skillIds", "name normalizedName")
      .populate("fieldIds", "name slug")
      .lean();

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Opportunity not found." },
      });
    }

    // Non-admin callers can only view published or expired listings
    if (
      opportunity.status !== "PUBLISHED" &&
      opportunity.status !== "EXPIRED" &&
      req.user?.role !== "ADMIN" &&
      req.user?.role !== "MODERATOR"
    ) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Opportunity not found." },
      });
    }

    // Attach distance if coordinates available from user profile or query params
    const queryLat = req.query.lat
      ? Number(req.query.lat)
      : (req.user?.profile?.location?.coordinates?.[1] ?? null);
    const queryLng = req.query.lng
      ? Number(req.query.lng)
      : (req.user?.profile?.location?.coordinates?.[0] ?? null);

    let itemDistanceKm = null;
    if (
      queryLat !== null &&
      queryLng !== null &&
      Array.isArray(opportunity.location?.coordinates) &&
      opportunity.location.coordinates.length === 2
    ) {
      itemDistanceKm = calculateDistanceKm(
        queryLat,
        queryLng,
        opportunity.location.coordinates[1],
        opportunity.location.coordinates[0]
      );
    }
    opportunity.distanceKm = itemDistanceKm;

    if (req.user?.profile) {
      opportunity.match = calculateMatch(req.user.profile, opportunity);
    }

    return res.status(200).json({
      success: true,
      data: opportunity,
    });
  } catch (error) {
    console.error("Get opportunity by id error:", error);
    const { status: statusCode, body } = formatErrorResponse(error, "Failed to fetch opportunity details.");
    return res.status(statusCode).json(body);
  }
};

/**
 * POST /api/opportunities
 * Admin / Moderator: Create a new opportunity listing.
 */
export const createOpportunity = async (req, res) => {
  try {
    const {
      title,
      organizationName,
      categoryId,
      description,
      applicationUrl,
      sourceUrl,
      sourceName = "Official Portal",
      sourceType = "OFFICIAL_WEBSITE",
      remoteType = "REMOTE",
      city,
      country,
      deadlineStatus = "FIXED",
      deadline,
      educationLevels = [],
      educationRequirements,
      experienceLevel = "ENTRY",
      eligibilityText,
      fundingType = "PAID",
      stipendAmount,
      currency = "USD",
      skillIds = [],
      fieldIds = [],
      status = "PUBLISHED",
    } = req.body;

    if (!title || !organizationName || !categoryId || !description || !applicationUrl) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "title, organizationName, categoryId, description, and applicationUrl are required.",
        },
      });
    }

    const categoryDoc = await Category.findById(categoryId);
    const categoryName = categoryDoc?.name || "";

    const derived = computeDerivedFields(
      {
        applicationUrl,
        organizationName,
        title,
        deadlineStatus,
        deadline,
        country,
        city,
      },
      { categoryName }
    );

    let locationData = null;
    if (req.body.location) {
      if (
        Array.isArray(req.body.location.coordinates) &&
        req.body.location.coordinates.length === 2
      ) {
        locationData = {
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
        locationData = {
          type: "Point",
          coordinates: [
            Number(req.body.location.lng),
            Number(req.body.location.lat),
          ],
        };
      }
    }

    const now = new Date();
    const opportunity = await Opportunity.create({
      title: title.trim(),
      organizationName: organizationName.trim(),
      categoryId,
      description: description.trim(),
      applicationUrl: applicationUrl.trim(),
      sourceUrl: sourceUrl ? sourceUrl.trim() : null,
      sourceName,
      sourceType,
      remoteType,
      city: city ? city.trim() : null,
      address: req.body.address ? req.body.address.trim() : null,
      location: locationData,
      country: country ? country.toUpperCase().trim() : null,
      deadlineStatus,
      deadline: deadline ? new Date(deadline) : null,
      educationLevels,
      educationRequirements,
      experienceLevel,
      eligibilityText,
      fundingType,
      stipendAmount: stipendAmount ? Number(stipendAmount) : null,
      currency,
      skillIds,
      fieldIds,
      status,
      verificationStatus: "VERIFIED",
      lastVerifiedAt: now,
      publishedAt: status === "PUBLISHED" ? now : null,
      createdByUserId: req.user._id,
      lastEditedByUserId: req.user._id,
      ...derived,
    });

    return res.status(201).json({
      success: true,
      message: "Opportunity created successfully.",
      data: opportunity,
    });
  } catch (error) {
    console.error("Create opportunity error:", error);
    const { status: statusCode, body } = formatErrorResponse(error, "Failed to create opportunity.");
    return res.status(statusCode).json(body);
  }
};

/**
 * PATCH /api/opportunities/:id
 * Admin / Moderator: Update or verify an opportunity listing.
 */
export const updateOpportunity = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const opportunity = await Opportunity.findById(id);
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Opportunity not found." },
      });
    }

    if (
      updates.applicationUrl ||
      updates.title ||
      updates.organizationName ||
      updates.deadline ||
      updates.country
    ) {
      const derived = computeDerivedFields({
        applicationUrl: updates.applicationUrl || opportunity.applicationUrl,
        organizationName: updates.organizationName || opportunity.organizationName,
        title: updates.title || opportunity.title,
        deadlineStatus: updates.deadlineStatus || opportunity.deadlineStatus,
        deadline: updates.deadline || opportunity.deadline,
        country: updates.country || opportunity.country,
        city: updates.city || opportunity.city,
      });
      Object.assign(updates, derived);
    }

    if (updates.location !== undefined) {
      if (updates.location === null) {
        updates.location = null;
      } else if (
        Array.isArray(updates.location.coordinates) &&
        updates.location.coordinates.length === 2
      ) {
        updates.location = {
          type: "Point",
          coordinates: [
            Number(updates.location.coordinates[0]),
            Number(updates.location.coordinates[1]),
          ],
        };
      } else if (
        updates.location.lat !== undefined &&
        updates.location.lng !== undefined
      ) {
        updates.location = {
          type: "Point",
          coordinates: [
            Number(updates.location.lng),
            Number(updates.location.lat),
          ],
        };
      }
    }

    updates.lastEditedByUserId = req.user._id;

    const updatedOpportunity = await Opportunity.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate("categoryId", "name slug")
      .populate("skillIds", "name normalizedName")
      .populate("fieldIds", "name slug");

    return res.status(200).json({
      success: true,
      message: "Opportunity updated successfully.",
      data: updatedOpportunity,
    });
  } catch (error) {
    console.error("Update opportunity error:", error);
    const { status: statusCode, body } = formatErrorResponse(error, "Failed to update opportunity.");
    return res.status(statusCode).json(body);
  }
};

/**
 * DELETE /api/opportunities/:id
 * Admin only: Delete an opportunity.
 */
export const deleteOpportunity = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Opportunity.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Opportunity not found." },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Opportunity deleted successfully.",
    });
  } catch (error) {
    console.error("Delete opportunity error:", error);
    const { status: statusCode, body } = formatErrorResponse(error, "Failed to delete opportunity.");
    return res.status(statusCode).json(body);
  }
};

/**
 * GET /api/opportunities/admin/queue
 * Admin / Moderator: Query all listings across any status (DRAFT, PENDING_REVIEW, PUBLISHED, FLAGGED, EXPIRED).
 */
export const getAdminOpportunitiesQueue = async (req, res) => {
  try {
    const { status, verificationStatus, search, page = 1, limit = 50 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status && status !== "ALL") {
      filter.status = status.toUpperCase();
    }
    if (verificationStatus && verificationStatus !== "ALL") {
      filter.verificationStatus = verificationStatus.toUpperCase();
    }
    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    const [opportunities, total] = await Promise.all([
      Opportunity.find(filter)
        .populate("categoryId", "name slug")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Opportunity.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: opportunities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Admin queue error:", error);
    const { status: statusCode, body } = formatErrorResponse(error, "Failed to fetch admin listings queue.");
    return res.status(statusCode).json(body);
  }
};
