import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import MatchBadge from "../components/MatchBadge.jsx";
import OpportunityCard from "../components/OpportunityCard.jsx";
import {
  Briefcase,
  Bookmark,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Building2,
  Compass,
  User,
} from "lucide-react";

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get("/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboardData(res.data.data);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      setError("Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to view your dashboard</h2>
        <p className="text-gray-500 mb-6 text-sm">
          Access your personal application timeline, upcoming deadlines, and tailored recommendations.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm text-sm"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white border border-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white border border-gray-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const { stageCounts, savedCount, urgentCount, timeline, recommendations } =
    dashboardData || {
      stageCounts: { TOTAL: 0 },
      savedCount: 0,
      urgentCount: 0,
      timeline: { urgent: [], thisMonth: [], later: [], rolling: [] },
      recommendations: [],
    };

  const isProfileComplete = Boolean(user.profile?.educationLevel && user.profile?.skillIds?.length);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-blue-800/80 text-blue-200 text-xs font-semibold rounded-lg border border-blue-700/50">
                Student Command Center
              </span>
              {!isProfileComplete && (
                <Link
                  to="/profile"
                  className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-2xs font-semibold rounded-lg border border-amber-500/40 hover:bg-amber-500/30 transition-colors"
                >
                  Profile Incomplete
                </Link>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              Welcome back, {user.displayName}!
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm max-w-xl">
              Track deadlines, monitor your application pipeline, and explore tailored opportunities.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/opportunities"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4" /> Explore Feed
            </Link>
            <Link
              to="/profile"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all border border-white/20 flex items-center gap-1.5"
            >
              <User className="w-4 h-4" /> Profile
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Tracked Applications */}
        <Link
          to="/applications"
          className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tracked Apps</span>
            <Briefcase className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900 mb-1">
            {stageCounts.TOTAL}
          </div>
          <div className="text-2xs text-gray-400 flex items-center justify-between">
            <span>{stageCounts.INTERVIEW} Interviewing · {stageCounts.APPLIED} Applied</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Saved Opportunities */}
        <Link
          to="/saved"
          className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Saved Listings</span>
            <Bookmark className="w-5 h-5 text-blue-600 fill-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900 mb-1">
            {savedCount}
          </div>
          <div className="text-2xs text-gray-400 flex items-center justify-between">
            <span>Bookmarked opportunities</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Urgent Deadlines */}
        <div
          className={`border rounded-2xl p-5 flex flex-col justify-between ${
            urgentCount > 0
              ? "bg-amber-50/50 border-amber-200 text-amber-900"
              : "bg-white border-gray-200 text-gray-900"
          }`}
        >
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Closing This Week</span>
            <Clock className={`w-5 h-5 ${urgentCount > 0 ? "text-amber-600" : "text-gray-400"}`} />
          </div>
          <div className="text-3xl font-extrabold mb-1">
            {urgentCount}
          </div>
          <div className="text-2xs text-gray-500">
            {urgentCount > 0 ? "Urgent deadlines <= 7 days" : "No urgent deadlines"}
          </div>
        </div>

        {/* Match Readiness */}
        <Link
          to="/profile"
          className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Match Engine</span>
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-base font-bold text-gray-800 mb-1 flex items-center gap-1.5">
            {isProfileComplete ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Active
              </span>
            ) : (
              <span className="text-amber-700 flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-amber-600" /> Incomplete
              </span>
            )}
          </div>
          <div className="text-2xs text-gray-400 flex items-center justify-between">
            <span>{isProfileComplete ? "Scores calculated live" : "Add skills to unlock"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>

      {/* Application Stage Pipeline */}
      {stageCounts.TOTAL > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-8 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Application Pipeline</h3>
            <Link to="/applications" className="text-xs font-semibold text-blue-600 hover:underline">
              View All Applications →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5">
              <span className="text-2xs text-blue-700 font-semibold block">Interested</span>
              <span className="text-lg font-bold text-blue-900">{stageCounts.INTERESTED}</span>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-2.5">
              <span className="text-2xs text-purple-700 font-semibold block">Applied</span>
              <span className="text-lg font-bold text-purple-900">{stageCounts.APPLIED}</span>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-2.5">
              <span className="text-2xs text-amber-800 font-semibold block">Interviewing</span>
              <span className="text-lg font-bold text-amber-900">{stageCounts.INTERVIEW}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5">
              <span className="text-2xs text-emerald-700 font-semibold block">Accepted</span>
              <span className="text-lg font-bold text-emerald-900">{stageCounts.ACCEPTED}</span>
            </div>
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-2.5">
              <span className="text-2xs text-rose-700 font-semibold block">Rejected</span>
              <span className="text-lg font-bold text-rose-900">{stageCounts.REJECTED}</span>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Deadlines Timeline */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" /> Upcoming Deadlines
            </h2>
            <p className="text-xs text-gray-500">
              Aggregated across your saved listings and active applications.
            </p>
          </div>
        </div>

        {timeline.urgent.length === 0 && timeline.thisMonth.length === 0 && timeline.later.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-2xs">
            <Clock className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-gray-900 mb-1">No upcoming deadlines</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
              Bookmark listings or track applications to see countdown timers and deadline reminders here.
            </p>
            <Link
              to="/opportunities"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              Discover Opportunities
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Urgent: Within 7 days */}
            {timeline.urgent.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700">
                    Urgent · Closing within 7 Days ({timeline.urgent.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {timeline.urgent.map((item) => (
                    <DeadlineCard key={item.opportunity._id} item={item} isUrgent />
                  ))}
                </div>
              </div>
            )}

            {/* This Month: 8 - 30 days */}
            {timeline.thisMonth.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-3">
                  Closing this Month ({timeline.thisMonth.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {timeline.thisMonth.map((item) => (
                    <DeadlineCard key={item.opportunity._id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Later: > 30 days */}
            {timeline.later.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  Later Deadlines ({timeline.later.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {timeline.later.map((item) => (
                    <DeadlineCard key={item.opportunity._id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recommended Opportunities for Profile */}
      {recommendations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" /> Recommended for You
              </h2>
              <p className="text-xs text-gray-500">
                Opportunities tailored to your discipline and technical skillset.
              </p>
            </div>
            <Link to="/opportunities" className="text-xs font-semibold text-blue-600 hover:underline">
              See All →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.map((opp) => (
              <OpportunityCard key={opp._id} opportunity={opp} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent: Deadline Timeline Item Card
function DeadlineCard({ item, isUrgent }) {
  const { opportunity, isSaved, applicationStatus, daysLeft } = item;

  return (
    <Link
      to={`/opportunities/${opportunity._id}`}
      className={`block border rounded-2xl p-4 transition-all hover:shadow-xs text-left bg-white ${
        isUrgent
          ? "border-amber-300 hover:border-amber-500"
          : "border-gray-200 hover:border-blue-400"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="px-2 py-0.5 text-2xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-md">
          {opportunity.categoryId?.name || "Listing"}
        </span>

        <span
          className={`flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full ${
            daysLeft <= 1
              ? "bg-rose-100 text-rose-800"
              : daysLeft <= 7
              ? "bg-amber-100 text-amber-800"
              : "bg-blue-50 text-blue-700"
          }`}
        >
          <Clock className="w-3 h-3" />
          {daysLeft === 0
            ? "Closing today"
            : daysLeft === 1
            ? "Closing tomorrow"
            : `${daysLeft} days left`}
        </span>
      </div>

      <h4 className="text-sm font-bold text-gray-900 line-clamp-1 mb-1 hover:text-blue-600 transition-colors">
        {opportunity.title}
      </h4>

      <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
        <span className="truncate">{opportunity.organizationName}</span>
        <div className="flex items-center gap-2 shrink-0">
          {opportunity.match?.score !== null && opportunity.match?.score !== undefined && (
            <MatchBadge score={opportunity.match.score} label={opportunity.match.label} />
          )}
          {applicationStatus && (
            <span className="px-2 py-0.5 text-2xs font-semibold bg-purple-50 text-purple-700 rounded-md border border-purple-200">
              {applicationStatus}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
