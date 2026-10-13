export class InvalidUrlError extends Error {}

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "fbclid",
  "gclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
]);

/**
 * Normalizes an application URL:
 * - strips tracking parameters
 * - strips trailing slashes and default ports
 * - sorts query parameters
 * - rejects non-http(s) and credentialed URLs
 */
export function normalizeUrl(input) {
  if (!input || typeof input !== "string") {
    throw new InvalidUrlError("URL is required");
  }

  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 2048) {
    throw new InvalidUrlError("URL length must be between 1 and 2048 characters");
  }

  let u;
  try {
    u = new URL(trimmed);
  } catch {
    throw new InvalidUrlError("Unparseable URL");
  }

  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new InvalidUrlError("Protocol must be http: or https:");
  }

  if (u.username || u.password) {
    throw new InvalidUrlError("URLs with embedded credentials are not allowed");
  }

  const hostname = u.hostname.replace(/\.+$/, "");
  const host = u.port ? `${hostname}:${u.port}` : hostname;
  const pathname = u.pathname.replace(/\/+$/, "");

  const kept = [...u.searchParams.entries()]
    .filter(([k]) => !TRACKING_PARAMS.has(k.toLowerCase()))
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0));

  const search = new URLSearchParams(kept).toString();
  return `${u.protocol}//${host}${pathname}${search ? "?" + search : ""}`;
}
