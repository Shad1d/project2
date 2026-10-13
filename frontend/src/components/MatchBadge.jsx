import React from "react";
import { Sparkles } from "lucide-react";

/**
 * MatchBadge component
 * Displays deterministic student-to-opportunity match percentage and tier label.
 *
 * Color Tiers:
 * - >= 75%: Strong Match (Emerald)
 * - >= 55%: Good Match (Blue)
 * - >= 35%: Partial Match (Amber)
 * - < 35%:  Low Match (Gray)
 */
export default function MatchBadge({ score, label, size = "sm" }) {
  if (score === null || score === undefined) return null;

  let bgClass = "bg-gray-100 text-gray-700 border-gray-200";
  let labelText = "Low Match";

  if (score >= 75 || label === "STRONG") {
    bgClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
    labelText = "Strong Match";
  } else if (score >= 55 || label === "GOOD") {
    bgClass = "bg-blue-50 text-blue-800 border-blue-200";
    labelText = "Good Match";
  } else if (score >= 35 || label === "PARTIAL") {
    bgClass = "bg-amber-50 text-amber-800 border-amber-200";
    labelText = "Partial Match";
  }

  const sizeClasses =
    size === "lg"
      ? "px-3 py-1.5 text-sm font-bold gap-1.5"
      : "px-2 py-0.5 text-xs font-semibold gap-1";

  return (
    <span
      className={`inline-flex items-center border rounded-lg shadow-2xs ${bgClass} ${sizeClasses}`}
      title={`${score}% compatibility with your profile`}
    >
      <Sparkles className={size === "lg" ? "w-4 h-4" : "w-3 h-3"} />
      <span>{score}%</span>
      <span className="hidden sm:inline font-medium">· {labelText}</span>
    </span>
  );
}
