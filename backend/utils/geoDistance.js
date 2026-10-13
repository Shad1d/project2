/**
 * Geospatial Distance Utility
 * Computes great-circle distance between coordinates using the Haversine formula.
 */

/**
 * Computes great-circle distance in kilometers between two latitude/longitude coordinates.
 *
 * @param {number} lat1 Latitude of point 1 (in degrees)
 * @param {number} lon1 Longitude of point 1 (in degrees)
 * @param {number} lat2 Latitude of point 2 (in degrees)
 * @param {number} lon2 Longitude of point 2 (in degrees)
 * @returns {number|null} Distance in kilometers rounded to 1 decimal place, or null if inputs invalid
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined || lat1 === null ||
    lon1 === undefined || lon1 === null ||
    lat2 === undefined || lat2 === null ||
    lon2 === undefined || lon2 === null ||
    isNaN(Number(lat1)) || isNaN(Number(lon1)) ||
    isNaN(Number(lat2)) || isNaN(Number(lon2))
  ) {
    return null;
  }

  const p1Lat = Number(lat1);
  const p1Lon = Number(lon1);
  const p2Lat = Number(lat2);
  const p2Lon = Number(lon2);

  // Identical point fast path
  if (p1Lat === p2Lat && p1Lon === p2Lon) {
    return 0;
  }

  const R = 6371; // Earth's mean radius in kilometers
  const dLat = ((p2Lat - p1Lat) * Math.PI) / 180;
  const dLon = ((p2Lon - p1Lon) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1Lat * Math.PI) / 180) *
      Math.cos((p2Lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
}
