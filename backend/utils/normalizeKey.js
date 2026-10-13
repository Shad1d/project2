/**
 * Normalizes text keys for duplicate warnings and matching.
 * Strips accents, lowercases, and replaces punctuation with spaces.
 */
export function normalizeKey(s) {
  if (!s || typeof s !== "string") return "";
  return s
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}


/**
 * Normalizes skill names (collapses whitespace, lowercases).
 */
export function normalizeSkillName(s) {
  if (!s || typeof s !== "string") return "";
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Generates URL-friendly slugs for categories and fields.
 */
export function slugify(s) {
  return normalizeKey(s).replace(/\s+/g, "-");
}
