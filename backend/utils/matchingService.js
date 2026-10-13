import {
  EXPERIENCE_RANK,
  EDUCATION_LABELS,
  EXPERIENCE_LABELS,
  REMOTE_LABELS,
  URGENCY_BONUS_TABLE,
} from "../config/constants.js";
import { calculateDistanceKm } from "./geoDistance.js";

export const MATCH_DISCLAIMER =
  "This is a recommendation based on your profile, not an eligibility guarantee.";

export const DISTANCE_BANDS = Object.freeze({
  NEARBY: 25,
  COMMUTABLE: 75,
  MID_RANGE: 200,
});

/**
 * Normalizes an arbitrary value (ObjectId, string, populated document) into a clean string id.
 */
function toId(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (val._id) return val._id.toString();
  if (val.id) return val.id.toString();
  if (typeof val.toString === "function") {
    const str = val.toString();
    return str !== "[object Object]" ? str : null;
  }
  return null;
}

/**
 * Normalizes an array of ids/documents into a unique deduplicated string id array.
 * Tolerates nulls, undefined, and duplicates.
 */
function toIdList(arr) {
  if (!Array.isArray(arr)) return [];
  const set = new Set();
  for (const item of arr) {
    const id = toId(item);
    if (id) set.add(id);
  }
  return Array.from(set);
}

/**
 * Validates GeoJSON point coordinates [longitude, latitude].
 * Rejects undefined, null, non-finite, out of range, or uninitialized [0, 0].
 */
function isValidCoords(coords) {
  if (!Array.isArray(coords) || coords.length !== 2) return false;
  const lon = Number(coords[0]);
  const lat = Number(coords[1]);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return false;
  if (lon < -180 || lon > 180 || lat < -90 || lat > 90) return false;
  if (lon === 0 && lat === 0) return false;
  return true;
}

/**
 * Rounds a number to 1 decimal place.
 */
function round1(num) {
  return Math.round(num * 10) / 10;
}

/**
 * Checks if student profile has minimum required fields for matching (Guideline 8.5).
 * Profile is ready when educationLevel is set AND user has at least one skill,
 * interest field, or major field.
 */
export function isMatchReady(p) {
  if (!p) return false;
  const hasEducation = p.educationLevel !== null && p.educationLevel !== undefined && p.educationLevel !== "";
  const skillCount = Array.isArray(p.skillIds) ? p.skillIds.length : 0;
  const interestCount = Array.isArray(p.interestFieldIds) ? p.interestFieldIds.length : 0;
  const hasMajor = Boolean(p.majorFieldId);

  return hasEducation && (skillCount > 0 || interestCount > 0 || hasMajor);
}

/**
 * Pure function: Computes deterministic match score (0-100) between a student profile and an opportunity.
 * Fully compliant with Guideline v3.2 sections 8.5, 8.6 and Spec v2.2 section 14.
 *
 * @param {object} profile - Student's profile from User document
 * @param {object} opportunity - Opportunity document
 * @returns {object} MatchResult with score, label, labelText, breakdown, reasons, warnings, missingProfileInfo, etc.
 */
export function calculateMatch(profile, opportunity) {
  if (!profile || !isMatchReady(profile)) {
    const missing = [];
    if (!profile || profile.educationLevel === null || profile.educationLevel === undefined || profile.educationLevel === "") {
      missing.push("educationLevel");
    }
    const skillCount = Array.isArray(profile?.skillIds) ? profile.skillIds.length : 0;
    const interestCount = Array.isArray(profile?.interestFieldIds) ? profile.interestFieldIds.length : 0;
    const hasMajor = Boolean(profile?.majorFieldId);
    if (skillCount === 0 && interestCount === 0 && !hasMajor) {
      missing.push("skills, interests or field of study");
    }

    return {
      score: null,
      label: null,
      labelText: null,
      breakdown: null,
      reasons: [],
      warnings: [],
      missingProfileInfo: missing,
      matchedSkillIds: [],
      unmatchedSkillIds: [],
      distanceKm: null,
      disclaimer: MATCH_DISCLAIMER,
    };
  }

  const reasons = [];
  const warnings = [];
  const missingProfileInfo = [];
  const breakdown = {};

  // Reuse pre-normalized sets if called via createMatcher, otherwise normalize
  const norm = profile._normalized;

  // ── 1. Education (Max 20 pts) ──────────────────────────────────────────────
  const oppEdu = Array.isArray(opportunity.educationLevels) ? opportunity.educationLevels : [];
  let eduPoints = 0;
  if (oppEdu.length === 0) {
    eduPoints = 10; // Neutral: open to all
  } else if (oppEdu.includes(profile.educationLevel)) {
    eduPoints = 20;
    reasons.push("Education requirement matches");
  } else {
    eduPoints = 0;
    const targetLabels = oppEdu.map((e) => EDUCATION_LABELS[e] || e).join(", ");
    warnings.push(`Education level may not match (opportunity targets: ${targetLabels})`);
  }
  breakdown.education = { points: round1(eduPoints), max: 20 };

  // ── 2. Skills (Max 30 pts) ─────────────────────────────────────────────────
  const oppSkillIds = toIdList(opportunity.skillIds);
  const userSkillSet = norm ? norm.userSkillSet : new Set(toIdList(profile.skillIds));
  let skillPoints = 0;
  const matchedSkillIds = [];
  const unmatchedSkillIds = [];

  if (oppSkillIds.length === 0) {
    skillPoints = 15; // Neutral
  } else {
    for (const sid of oppSkillIds) {
      if (userSkillSet.has(sid)) {
        matchedSkillIds.push(sid);
      } else {
        unmatchedSkillIds.push(sid);
      }
    }

    if (userSkillSet.size === 0) {
      skillPoints = 0;
      missingProfileInfo.push("skills");
    } else {
      const m = matchedSkillIds.length;
      const t = oppSkillIds.length;
      skillPoints = (30 * m) / t;
      if (m > 0) {
        reasons.push(`${m} of ${t} skills match`);
      } else {
        warnings.push("None of the listed skills are in your profile");
      }
    }
  }
  breakdown.skills = { points: round1(skillPoints), max: 30 };

  // ── 3. Field of Study / Discipline (Max 20 pts) ────────────────────────────
  const oppFieldIds = toIdList(opportunity.fieldIds);
  const userFieldSet = norm
    ? norm.userFieldSet
    : new Set([
        ...toIdList(profile.interestFieldIds),
        ...(profile.majorFieldId ? [toId(profile.majorFieldId)] : []),
      ].filter(Boolean));

  let fieldPoints = 0;
  if (oppFieldIds.length === 0) {
    fieldPoints = 10; // Neutral
  } else if (userFieldSet.size === 0) {
    fieldPoints = 0;
    missingProfileInfo.push("fields of interest");
  } else {
    const hasOverlap = oppFieldIds.some((f) => userFieldSet.has(f));
    if (hasOverlap) {
      fieldPoints = 20;
      reasons.push("Field matches");
    } else {
      fieldPoints = 0;
      warnings.push("Field does not match your listed interests");
    }
  }
  breakdown.field = { points: round1(fieldPoints), max: 20 };

  // ── 4. Location & Remote Mode (Max 10 pts) ──────────────────────────────────
  // Part A: Work mode (5 pts)
  let modePoints = 0;
  const pref = profile.remotePreference || "ANY";
  const oppMode = opportunity.remoteType;

  if (pref === "ANY") {
    modePoints = 5;
  } else if (!oppMode) {
    modePoints = 2.5;
  } else {
    const WORK_MODE_MATRIX = {
      REMOTE: { REMOTE: 5, HYBRID: 2.5, ONSITE: 0 },
      HYBRID: { REMOTE: 2.5, HYBRID: 5, ONSITE: 2.5 },
      ONSITE: { REMOTE: 0, HYBRID: 2.5, ONSITE: 5 },
    };
    const row = WORK_MODE_MATRIX[pref];
    modePoints = row && row[oppMode] !== undefined ? row[oppMode] : 2.5;

    if (modePoints === 5) {
      reasons.push("Remote preference matches");
    } else if (modePoints === 0) {
      const oppLabel = REMOTE_LABELS[oppMode] || oppMode.toLowerCase();
      const prefLabel = REMOTE_LABELS[pref] || pref.toLowerCase();
      warnings.push(`Opportunity is ${oppLabel}; you prefer ${prefLabel}`);
    }
  }

  // Part B: Geographic Proximity & Place (5 pts)
  let placePoints = 0;
  let distanceKm = null;

  const userCoords = profile.location?.coordinates;
  const oppCoords = opportunity.location?.coordinates;
  const bothHaveCoords = isValidCoords(userCoords) && isValidCoords(oppCoords);

  if (oppMode === "REMOTE") {
    placePoints = 5; // Remote is accessible from any location; no extra reason
  } else {
    const prefLocations = norm
      ? norm.prefLocations
      : Array.isArray(profile.preferredLocations)
      ? profile.preferredLocations.filter((loc) => loc && loc.country)
      : [];

    if (prefLocations.length > 0) {
      if (!opportunity.country) {
        placePoints = 2.5;
      } else {
        const matchingCountryPrefs = prefLocations.filter(
          (loc) => loc.country.toUpperCase() === opportunity.country.toUpperCase()
        );
        if (matchingCountryPrefs.length === 0) {
          placePoints = 0;
          warnings.push("Location is outside your preferred locations");
        } else {
          const hasCityMatch = matchingCountryPrefs.some(
            (loc) =>
              !loc.city ||
              (opportunity.city && loc.city.toLowerCase() === opportunity.city.toLowerCase())
          );
          if (hasCityMatch) {
            placePoints = 5;
            reasons.push("Location matches your preferences");
          } else {
            placePoints = 2.5;
          }
        }
      }
    } else if (bothHaveCoords) {
      // Score by distance when preferredLocations is not set
      // GeoJSON coordinates are [lon, lat] -> lat is index 1, lon is index 0
      const rawDist = calculateDistanceKm(userCoords[1], userCoords[0], oppCoords[1], oppCoords[0]);
      if (rawDist !== null) {
        distanceKm = Math.round(rawDist);
        if (distanceKm <= DISTANCE_BANDS.NEARBY) {
          placePoints = 5;
          reasons.push(`Location is nearby (${distanceKm} km away)`);
        } else if (distanceKm <= DISTANCE_BANDS.COMMUTABLE) {
          placePoints = 3.5;
          reasons.push(`Location is within commutable distance (${distanceKm} km away)`);
        } else if (distanceKm <= DISTANCE_BANDS.MID_RANGE) {
          placePoints = 2; // Scores 2/5 silently without positive reason
        } else {
          placePoints = 0;
          warnings.push(`Location is far from your profile (${distanceKm} km away)`);
        }
      } else {
        placePoints = 2.5;
      }
    } else {
      // Country fallback
      if (!profile.country || !opportunity.country) {
        placePoints = 2.5;
      } else if (profile.country.toUpperCase() === opportunity.country.toUpperCase()) {
        placePoints = 5;
        reasons.push("Location matches your preferences");
      } else {
        placePoints = 0;
        warnings.push("Location is outside your preferred locations");
      }
    }

    // Ensure distanceKm is calculated and attached whenever both coordinates exist
    if (bothHaveCoords && distanceKm === null) {
      const rawDist = calculateDistanceKm(userCoords[1], userCoords[0], oppCoords[1], oppCoords[0]);
      if (rawDist !== null) {
        distanceKm = Math.round(rawDist);
      }
    }
  }
  breakdown.location = { points: round1(modePoints + placePoints), max: 10 };

  // ── 5. Category (Max 10 pts) ───────────────────────────────────────────────
  const prefCats = norm ? norm.prefCats : toIdList(profile.preferredCategoryIds);
  const oppCatId = toId(opportunity.categoryId);

  let catPoints = 0;
  if (prefCats.length === 0) {
    catPoints = 5; // Neutral
  } else if (oppCatId && prefCats.includes(oppCatId)) {
    catPoints = 10;
    reasons.push("Matches a category you prefer");
  } else {
    catPoints = 0;
  }
  breakdown.category = { points: round1(catPoints), max: 10 };

  // ── 6. Experience Level (Max 10 pts) ────────────────────────────────────────
  let expPoints = 0;
  const oppExp = opportunity.experienceLevel;
  const userExp = profile.experienceLevel;

  if (oppExp === null || oppExp === undefined || oppExp === "") {
    expPoints = 5; // Neutral, not stated = 5, no message
  } else if (oppExp === "NONE") {
    expPoints = 10;
    reasons.push("No prior experience required");
  } else if (userExp === null || userExp === undefined || userExp === "") {
    expPoints = 0;
    missingProfileInfo.push("experience level");
  } else {
    const oppRank = EXPERIENCE_RANK[oppExp];
    const userRank = EXPERIENCE_RANK[userExp];

    if (oppRank === undefined || userRank === undefined) {
      expPoints = 5; // Invalid enum treated as not provided
    } else if (userRank >= oppRank) {
      expPoints = 10;
      reasons.push("Your experience level meets the expectation");
    } else if (oppRank - userRank === 1) {
      expPoints = 5;
      const oppLabel = EXPERIENCE_LABELS[oppExp] || oppExp;
      warnings.push(`Opportunity prefers: ${oppLabel}`);
    } else {
      expPoints = 0;
      const oppLabel = EXPERIENCE_LABELS[oppExp] || oppExp;
      warnings.push(`Opportunity prefers: ${oppLabel}`);
    }
  }
  breakdown.experience = { points: round1(expPoints), max: 10 };

  // ── Final Score Calculation (Rounded once at the end) ──────────────────────
  const totalPoints =
    eduPoints + skillPoints + fieldPoints + modePoints + placePoints + catPoints + expPoints;
  const score = Math.min(100, Math.max(0, Math.round(totalPoints)));

  let label = "LOW";
  let labelText = "Low match based on the information in your profile.";
  if (score >= 75) {
    label = "STRONG";
    labelText = "Strong match based on the information in your profile.";
  } else if (score >= 55) {
    label = "GOOD";
    labelText = "Good match based on the information in your profile.";
  } else if (score >= 35) {
    label = "PARTIAL";
    labelText = "Partial match based on the information in your profile.";
  }

  const dedupedMissing = Array.from(new Set(missingProfileInfo));

  return {
    score,
    label,
    labelText,
    breakdown,
    reasons,
    warnings,
    missingProfileInfo: dedupedMissing,
    matchedSkillIds,
    unmatchedSkillIds,
    distanceKm,
    disclaimer: MATCH_DISCLAIMER,
  };
}

/**
 * Normalizes a profile once and returns a fast matching function for scoring lists of opportunities.
 *
 * @param {object} profile - Student's profile from User document
 * @returns {Function} Function taking an opportunity and returning MatchResult
 */
export function createMatcher(profile) {
  if (!profile || !isMatchReady(profile)) {
    return (opportunity) => calculateMatch(profile, opportunity);
  }

  const userSkillIds = toIdList(profile.skillIds);
  const userSkillSet = new Set(userSkillIds);
  const userFieldList = [
    ...toIdList(profile.interestFieldIds),
    ...(profile.majorFieldId ? [toId(profile.majorFieldId)] : []),
  ].filter(Boolean);
  const userFieldSet = new Set(userFieldList);
  const prefCats = toIdList(profile.preferredCategoryIds);
  const prefLocations = Array.isArray(profile.preferredLocations)
    ? profile.preferredLocations.filter((loc) => loc && loc.country)
    : [];

  const normalizedProfile = {
    ...profile,
    _normalized: {
      userSkillIds,
      userSkillSet,
      userFieldList,
      userFieldSet,
      prefCats,
      prefLocations,
    },
  };

  return (opportunity) => calculateMatch(normalizedProfile, opportunity);
}

/**
 * Calculates urgency bonus based on deadline hours remaining (Guideline 8.6).
 *
 * @param {Date|string|null} deadline - Opportunity deadline
 * @param {string|null} status - Deadline status (must be "FIXED")
 * @param {Date} [now] - Current timestamp (defaults to new Date())
 * @returns {number} Bonus points (0, 4, 8, 12, or 15)
 */
export function urgencyBonus(deadline, status, now = new Date()) {
  if (status !== "FIXED" || !deadline) return 0;
  const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline);
  const nowDate = now instanceof Date ? now : new Date(now);
  if (isNaN(deadlineDate.getTime()) || isNaN(nowDate.getTime())) return 0;

  const hours = (deadlineDate.getTime() - nowDate.getTime()) / 3_600_000;
  if (hours <= 0) return 0;

  for (const row of URGENCY_BONUS_TABLE) {
    if (hours <= row.maxHoursLeft) {
      return row.bonus;
    }
  }
  return 0;
}

/**
 * Computes personalized rank combining match score and urgency bonus (max 115).
 *
 * @param {number|null} matchScore - Base match score 0..100
 * @param {number} [bonus] - Urgency bonus 0..15
 * @returns {number|null} Personalized rank up to 115, or null if matchScore is null
 */
export function personalizedRank(matchScore, bonus = 0) {
  if (matchScore === null || matchScore === undefined) return null;
  return Math.min(115, Math.max(0, matchScore + (bonus || 0)));
}
