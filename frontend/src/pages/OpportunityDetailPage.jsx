import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useSaved } from "../context/SavedContext.jsx";
import MatchBadge from "../components/MatchBadge.jsx";
import toast from "react-hot-toast";
import {
  Building2,
  Calendar,
  MapPin,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  Briefcase,
  GraduationCap,
  Award,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Bookmark,
  Flag,
} from "lucide-react";
import ReportModal from "../components/ReportModal.jsx";
import LocationPickerMap from "../components/LocationPickerMap.jsx";

export default function OpportunityDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const { isSaved, toggleSave } = useSaved();
  const [opportunity, setOpportunity] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const saved = isSaved(id);

  // Fetch opportunity and application tracking status
  useEffect(() => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    api
      .get(`/opportunities/${id}`, { headers })
      .then((res) => {
        setOpportunity(res.data.data);
      })
      .catch((err) => {
        setError(err.response?.data?.error?.message || "Opportunity not found.");
      })
      .finally(() => {
        setLoading(false);
      });

    if (token) {
      api
        .get("/applications", { headers })
        .then((res) => {
          const found = (res.data.data || []).find(
            (a) => a.opportunityId?._id === id || a.opportunityId === id
          );
          if (found) setApplication(found);
        })
        .catch(() => {});
    }
  }, [id, token]);

  const handleTrackStatus = async (newStatus) => {
    if (!token) {
      toast.error("Please sign in to track applications.");
      return;
    }
    try {
      const res = await api.post(
        "/applications",
        { opportunityId: id, status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApplication(res.data.data);
      toast.success(`Application stage set to ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Failed to update tracker.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500">Loading opportunity details...</p>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Not Found</h2>
        <p className="text-gray-500 mb-6">{error || "This opportunity does not exist or has been removed."}</p>
        <Link
          to="/opportunities"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Opportunities
        </Link>
      </div>
    );
  }

  const {
    title,
    organizationName,
    categoryId,
    description,
    applicationUrl,
    country,
    city,
    remoteType,
    deadlineStatus,
    deadline,
    educationLevels,
    educationRequirements,
    experienceLevel,
    eligibilityText,
    fundingType,
    stipendAmount,
    currency,
    skillIds,
    verificationStatus,
    lastVerifiedAt,
  } = opportunity;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <Link
        to="/opportunities"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> All Opportunities
      </Link>

      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-sm mb-8">
        {/* Header Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg">
            {categoryId?.name || "Opportunity"}
          </span>

          {verificationStatus === "VERIFIED" && (
            <span className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Listing
            </span>
          )}

          {lastVerifiedAt && (
            <span className="text-xs text-gray-400">
              Checked on {new Date(lastVerifiedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
          {title}
        </h1>

        {/* Organization & Location Meta */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-gray-600 mb-8 border-b border-gray-100 pb-6">
          <span className="flex items-center gap-1.5 font-medium text-gray-900">
            <Building2 className="w-4 h-4 text-blue-600" />
            {organizationName}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-gray-400" />
            {remoteType === "REMOTE"
              ? "Remote (Work from anywhere)"
              : city
              ? `${city}, ${country || ""}`
              : country || "On-site"}
          </span>
          {opportunity.distanceKm !== null && opportunity.distanceKm !== undefined && (
            <span className="flex items-center gap-1.5 font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg text-xs">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              {opportunity.distanceKm} km from your location
            </span>
          )}
          {deadline && (
            <span className="flex items-center gap-1.5 text-amber-700 font-medium">
              <Calendar className="w-4 h-4 text-amber-600" />
              Deadline: {new Date(deadline).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </span>
          )}
        </div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 rounded-2xl p-4 mb-8 text-xs sm:text-sm">
          <div>
            <span className="text-gray-400 block mb-1">Target Education</span>
            <span className="font-semibold text-gray-800">
              {educationLevels?.length > 0 ? educationLevels.join(", ") : "Open to All"}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block mb-1">Experience Level</span>
            <span className="font-semibold text-gray-800">
              {experienceLevel || "Not Stated"}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block mb-1">Funding / Pay</span>
            <span className="font-semibold text-emerald-700">
              {stipendAmount ? `${currency || "$"}${stipendAmount}` : fundingType?.replace("_", " ") || "Unstated"}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block mb-1">Deadline Status</span>
            <span className="font-semibold text-gray-800">
              {deadlineStatus?.replace(/_/g, " ") || "Fixed"}
            </span>
          </div>
        </div>

        {/* Match Analysis Section */}
        {user ? (
          opportunity.match?.score !== null && opportunity.match?.score !== undefined ? (
            <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/40 border border-blue-200/80 rounded-2xl p-5 sm:p-6 mb-8 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-bold text-gray-900">Personalized Match Analysis</h2>
                  </div>
                  <p className="text-xs text-gray-500">{opportunity.match.disclaimer}</p>
                </div>
                <MatchBadge score={opportunity.match.score} label={opportunity.match.label} size="lg" />
              </div>

              {/* Breakdown Grid */}
              {opportunity.match.breakdown && (
                <div className="py-4 border-b border-blue-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                    Score Breakdown (Total: {opportunity.match.score}/100)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries({
                      Education: opportunity.match.breakdown.education,
                      Skills: opportunity.match.breakdown.skills,
                      "Discipline / Field": opportunity.match.breakdown.field,
                      "Location & Mode": opportunity.match.breakdown.location,
                      Category: opportunity.match.breakdown.category,
                      Experience: opportunity.match.breakdown.experience,
                    }).map(([dimension, data]) => {
                      if (!data) return null;
                      const pct = Math.round((data.points / data.max) * 100);
                      return (
                        <div key={dimension} className="bg-white/80 border border-blue-100 rounded-xl p-3 shadow-2xs">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-medium text-gray-700 truncate">{dimension}</span>
                            <span className="font-bold text-gray-900">
                              {data.points}/{data.max}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : "bg-amber-400"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Positive Strengths */}
              {opportunity.match.reasons?.length > 0 && (
                <div className="pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Why this matches your profile
                  </h4>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-gray-700">
                    {opportunity.match.reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Considerations & Warnings */}
              {opportunity.match.warnings?.length > 0 && (
                <div className="pt-4 border-t border-blue-100/60 mt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    Considerations & Requirements
                  </h4>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-gray-700">
                    {opportunity.match.warnings.map((warning, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-0.5 sm:mt-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">Complete your profile for match scoring</h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Add your current education level and technical skills to unlock match scoring for this listing.
                  </p>
                </div>
              </div>
              <Link
                to="/profile"
                className="shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                Update Profile
              </Link>
            </div>
          )
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-xl shrink-0 mt-0.5 sm:mt-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Personalized Match Breakdown</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Sign in to see how your education, academic field, and skills stack up against this opportunity.
                </p>
              </div>
            </div>
            <Link
              to="/login"
              className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              Sign In to Match
            </Link>
          </div>
        )}

        {/* Description */}
        <div className="space-y-6 text-gray-700 leading-relaxed text-sm sm:text-base mb-10">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Description</h3>
            <p className="whitespace-pre-line">{description}</p>
          </div>

          {/* Eligibility Criteria */}
          {eligibilityText && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Eligibility Criteria</h3>
              <p className="whitespace-pre-line bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-gray-800 text-sm">
                {eligibilityText}
              </p>
            </div>
          )}

          {/* Required / Recommended Skills */}
          {skillIds?.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" /> Relevant Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {skillIds.map((skill) => (
                  <span
                    key={skill._id || skill}
                    className="px-3 py-1 bg-gray-100 text-gray-800 rounded-lg text-xs font-medium"
                  >
                    {skill.name || skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Venue & Location Map */}
          {Array.isArray(opportunity.location?.coordinates) &&
            opportunity.location.coordinates.length === 2 && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Venue & Campus Location
                </h3>
                {opportunity.address && (
                  <p className="text-xs text-gray-600 mb-3">{opportunity.address}</p>
                )}
                <LocationPickerMap
                  coords={{
                    lat: opportunity.location.coordinates[1],
                    lng: opportunity.location.coordinates[0],
                  }}
                  address={opportunity.address || `${city || ""}, ${country || ""}`}
                  readOnly={true}
                  height="250px"
                  label=""
                />
              </div>
            )}
        </div>

        {/* Call to Action & Management Footer */}
        <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Bookmark button */}
            <button
              type="button"
              onClick={() => toggleSave(id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                saved
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
              }`}
            >
              <Bookmark className={`w-4 h-4 ${saved ? "fill-blue-600 text-blue-600" : ""}`} />
              {saved ? "Saved to Bookmarks" : "Save Opportunity"}
            </button>

            {/* Application Tracker Selector (for authenticated students) */}
            {user && (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <Briefcase className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-xs text-gray-600 font-medium">Stage:</span>
                <select
                  value={application?.status || "NOT_TRACKED"}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next !== "NOT_TRACKED") {
                      handleTrackStatus(next);
                    }
                  }}
                  className="bg-transparent text-xs font-semibold text-gray-800 outline-none cursor-pointer"
                >
                  <option value="NOT_TRACKED">Not Tracking</option>
                  <option value="INTERESTED">Interested</option>
                  <option value="APPLIED">Applied</option>
                  <option value="INTERVIEW">Interviewing</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            )}
          </div>

          <a
            href={applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all text-sm cursor-pointer"
          >
            Apply on Official Site <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Community Quality Note & Report trigger */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-2xs text-gray-400">
          <span>Noticed an expired deadline or broken link?</span>
          <button
            type="button"
            onClick={() => setReportModalOpen(true)}
            className="inline-flex items-center gap-1 text-gray-500 hover:text-rose-600 transition-colors font-semibold cursor-pointer"
          >
            <Flag className="w-3 h-3" /> Report Listing
          </button>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        opportunityId={id}
        opportunityTitle={title}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </div>
  );
}
