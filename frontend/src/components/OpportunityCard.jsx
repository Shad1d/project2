import React from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Building2, DollarSign, Clock, ArrowUpRight, Bookmark } from "lucide-react";
import MatchBadge from "./MatchBadge.jsx";
import { useSaved } from "../context/SavedContext.jsx";

export default function OpportunityCard({ opportunity }) {
  const { isSaved, toggleSave } = useSaved();
  const {
    _id,
    title,
    organizationName,
    categoryId,
    remoteType,
    city,
    country,
    deadlineStatus,
    deadline,
    fundingType,
    stipendAmount,
    currency,
  } = opportunity;

  // Format deadline badge text
  const getDeadlineBadge = () => {
    if (deadlineStatus !== "FIXED" || !deadline) {
      if (deadlineStatus === "OPEN_UNTIL_FILLED") return "Open until filled";
      if (deadlineStatus === "NO_DEADLINE") return "No deadline";
      return "Rolling";
    }

    const dl = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil((dl - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Closing today";
    if (diffDays === 1) return "Closing tomorrow";
    if (diffDays <= 7) return `Closing in ${diffDays} days`;
    return `Closes ${dl.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  };

  const deadlineText = getDeadlineBadge();
  const isUrgent = deadlineText.includes("today") || deadlineText.includes("tomorrow") || deadlineText.includes("days");

  return (
    <Link
      to={`/opportunities/${_id}`}
      className="group block bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between text-left"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg">
              {categoryId?.name || "Opportunity"}
            </span>
            {opportunity.match?.score !== null && opportunity.match?.score !== undefined && (
              <MatchBadge score={opportunity.match.score} label={opportunity.match.label} />
            )}
            {opportunity.distanceKm !== null && opportunity.distanceKm !== undefined && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-md">
                <MapPin className="w-3 h-3 text-emerald-600" />
                {opportunity.distanceKm} km away
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full ${
                isUrgent
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <Clock className="w-3 h-3" />
              {deadlineText}
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleSave(_id);
              }}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
              title={isSaved(_id) ? "Remove from saved" : "Save opportunity"}
            >
              <Bookmark className={`w-4 h-4 ${isSaved(_id) ? "fill-blue-600 text-blue-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1.5">
          {title}
        </h3>

        {/* Organization */}
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600 mb-4">
          <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="truncate">{organizationName}</span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          {/* Location / Remote */}
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            {remoteType === "REMOTE"
              ? "Remote"
              : city
              ? `${city}, ${country || ""}`
              : country || "On-site"}
          </span>

          {/* Funding */}
          {fundingType && fundingType !== "UNKNOWN" && (
            <span className="flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              <DollarSign className="w-3 h-3" />
              {stipendAmount ? `${currency || "$"}${stipendAmount}` : fundingType.replace("_", " ")}
            </span>
          )}
        </div>

        <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
          View <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
}
