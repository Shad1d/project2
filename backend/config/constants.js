/**
 * Application Constants & Enums
 * Source of truth for database schema validation and API business rules.
 */

export const USER_ROLES = Object.freeze(["USER", "MODERATOR", "ADMIN"]);

export const OPPORTUNITY_STATUSES = Object.freeze([
  "DRAFT",
  "PENDING_REVIEW",
  "PUBLISHED",
  "REJECTED",
  "EXPIRED",
  "ARCHIVED",
]);

export const DEADLINE_STATUSES = Object.freeze([
  "FIXED",
  "OPEN_UNTIL_FILLED",
  "NO_DEADLINE",
  "UNKNOWN",
]);

export const VERIFICATION_STATUSES = Object.freeze([
  "UNVERIFIED",
  "REVIEWED",
  "VERIFIED",
  "FLAGGED",
]);

export const SOURCE_TYPES = Object.freeze([
  "OFFICIAL_WEBSITE",
  "UNIVERSITY",
  "GOVERNMENT",
  "ORGANIZATION",
  "TRUSTED_FEED",
  "USER_SUBMITTED",
]);

export const APPLICATION_EFFORTS = Object.freeze([
  "LOW",
  "MEDIUM",
  "HIGH",
  "UNKNOWN",
]);

export const REMOTE_TYPES = Object.freeze(["REMOTE", "HYBRID", "ONSITE"]);
export const REMOTE_PREFERENCES = Object.freeze(["ANY", "REMOTE", "HYBRID", "ONSITE"]);

export const EDUCATION_LEVELS = Object.freeze([
  "HIGH_SCHOOL",
  "UNDERGRADUATE",
  "RECENT_GRADUATE",
  "MASTERS",
  "PHD",
]);

export const EXPERIENCE_LEVELS = Object.freeze([
  "NONE",
  "ENTRY",
  "INTERMEDIATE",
  "ADVANCED",
]);

export const FUNDING_TYPES = Object.freeze([
  "FULLY_FUNDED",
  "PARTIALLY_FUNDED",
  "PAID",
  "UNPAID",
  "UNKNOWN",
]);

export const APPLICATION_STATUSES = Object.freeze([
  "INTERESTED",
  "APPLIED",
  "INTERVIEW",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
]);

export const REPORT_REASONS = Object.freeze([
  "EXPIRED",
  "INCORRECT_INFORMATION",
  "BROKEN_LINK",
  "SUSPICIOUS_SCAM",
  "DUPLICATE",
  "OTHER",
]);

export const REPORT_STATUSES = Object.freeze([
  "OPEN",
  "REVIEWING",
  "RESOLVED",
  "DISMISSED",
]);

export const NOTIFICATION_TYPES = Object.freeze([
  "DEADLINE_3_DAYS",
  "DEADLINE_1_DAY",
]);

export const NOTIFICATION_STATUSES = Object.freeze([
  "PENDING",
  "SENT",
  "FAILED",
]);

export const CATEGORY_SLUGS = Object.freeze([
  "internship",
  "job",
  "scholarship",
  "hackathon",
  "competition",
  "fellowship",
  "grant",
  "research",
  "conference",
]);

export const EXPERIENCE_RANK = Object.freeze({
  NONE: 0,
  ENTRY: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
});

export const URGENCY_BONUS_TABLE = Object.freeze([
  { maxHoursLeft: 24, bonus: 15 },
  { maxHoursLeft: 72, bonus: 12 },
  { maxHoursLeft: 168, bonus: 8 },
  { maxHoursLeft: 336, bonus: 4 },
]);

export const EDUCATION_LABELS = Object.freeze({
  HIGH_SCHOOL: "High school",
  UNDERGRADUATE: "Undergraduate",
  RECENT_GRADUATE: "Recent graduate",
  MASTERS: "Master's",
  PHD: "PhD",
});

export const EXPERIENCE_LABELS = Object.freeze({
  NONE: "No experience needed",
  ENTRY: "Some experience (under 1 year)",
  INTERMEDIATE: "1-3 years of experience",
  ADVANCED: "3+ years of experience",
});

export const REMOTE_LABELS = Object.freeze({
  REMOTE: "remote",
  HYBRID: "hybrid",
  ONSITE: "on-site",
  ANY: "flexible",
});
