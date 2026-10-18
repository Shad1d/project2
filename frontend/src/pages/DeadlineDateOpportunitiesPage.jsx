import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import OpportunityCard from "../components/OpportunityCard.jsx";
import { formatDateKey } from "./DeadlinesCalendarPage.jsx";
import {
  Calendar,
  ChevronLeft,
  Clock,
  Briefcase,
  AlertCircle,
  Filter,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export default function DeadlineDateOpportunitiesPage() {
  const { date } = useParams(); // Expected format: YYYY-MM-DD
  const navigate = useNavigate();

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRemote, setSelectedRemote] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Parse the date from URL
  const parsedDate = useMemo(() => {
    if (!date) return null;
    const parts = date.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const res = new Date(y, m, d);
      if (!isNaN(res.getTime())) return res;
    }
    const fallback = new Date(date);
    return isNaN(fallback.getTime()) ? null : fallback;
  }, [date]);

  // Formatted date string for header
  const formattedDateString = useMemo(() => {
    if (!parsedDate) return date;
    return parsedDate.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [parsedDate]);

  // Urgency & Countdown
  const countdownInfo = useMemo(() => {
    if (!parsedDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const target = new Date(parsedDate);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: "Deadline passed", style: "bg-gray-100 text-gray-700 border-gray-300" };
    }
    if (diffDays === 0) {
      return { text: "Closing today!", style: "bg-red-50 text-red-700 border-red-300 animate-pulse font-bold" };
    }
    if (diffDays === 1) {
      return { text: "Closing tomorrow", style: "bg-amber-50 text-amber-800 border-amber-300 font-bold" };
    }
    if (diffDays <= 7) {
      return { text: `Closing in ${diffDays} days`, style: "bg-amber-50 text-amber-800 border-amber-200" };
    }
    return { text: `Closing in ${diffDays} days`, style: "bg-emerald-50 text-emerald-800 border-emerald-200" };
  }, [parsedDate]);

  // Fetch opportunities and filter for matching deadline date
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchMatchingOpportunities = async () => {
      try {
        const res = await api.get("/opportunities", {
          params: { limit: 100, sort: "deadline_soonest" },
        });

        let allOpps = res.data.data || [];

        if (res.data.pagination && res.data.pagination.totalPages > 1) {
          const totalPages = Math.min(res.data.pagination.totalPages, 5);
          const pagePromises = [];
          for (let p = 2; p <= totalPages; p++) {
            pagePromises.push(
              api.get("/opportunities", {
                params: { limit: 100, page: p, sort: "deadline_soonest" },
              })
            );
          }
          const additional = await Promise.all(pagePromises);
          additional.forEach((r) => {
            if (r.data.data) {
              allOpps = allOpps.concat(r.data.data);
            }
          });
        }

        if (isMounted) {
          // Filter opportunities whose deadline matches the requested date
          const matched = allOpps.filter((opp) => {
            if (!opp.deadline) return false;
            const oppKey = formatDateKey(opp.deadline);
            return oppKey === date;
          });
          setOpportunities(matched);
        }
      } catch (err) {
        console.error("Failed to fetch opportunities for deadline date:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMatchingOpportunities();
    return () => {
      isMounted = false;
    };
  }, [date]);

  // Extract unique categories from the matched opportunities
  const availableCategories = useMemo(() => {
    const cats = new Map();
    opportunities.forEach((opp) => {
      if (opp.categoryId) {
        const id = opp.categoryId._id || opp.categoryId;
        const name = opp.categoryId.name || opp.categoryId;
        const slug = opp.categoryId.slug || id;
        cats.set(slug, name);
      }
    });
    return Array.from(cats.entries()).map(([slug, name]) => ({ slug, name }));
  }, [opportunities]);

  // Filter matched opportunities by remoteType and category if chosen
  const filtered = useMemo(() => {
    return opportunities.filter((opp) => {
      if (selectedRemote && opp.remoteType !== selectedRemote) return false;
      if (selectedCategory) {
        const oppCatSlug = opp.categoryId?.slug || opp.categoryId;
        if (oppCatSlug !== selectedCategory) return false;
      }
      return true;
    });
  }, [opportunities, selectedRemote, selectedCategory]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link
          to="/deadlines"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Deadlines Calendar</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 mb-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700">
                <Calendar className="w-3.5 h-3.5" />
                Deadline Date
              </span>
              {countdownInfo && (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${countdownInfo.style}`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {countdownInfo.text}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {formattedDateString}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Showing all verified opportunities with application closing deadline on this date.
            </p>
          </div>

          <div className="text-right sm:border-l sm:border-gray-200 sm:pl-6 shrink-0">
            <span className="text-xs text-gray-400 block font-medium">Opportunities</span>
            <span className="text-3xl font-extrabold text-gray-900">
              {opportunities.length}
            </span>
          </div>
        </div>

        {/* Quick Filter Bar */}
        {opportunities.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mt-6 pt-5 border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>

            {/* Remote Filter */}
            <select
              value={selectedRemote}
              onChange={(e) => setSelectedRemote(e.target.value)}
              className="text-xs font-medium border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Work Modes</option>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ONSITE">On-site</option>
            </select>

            {/* Category Filter */}
            {availableCategories.length > 1 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs font-medium border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">All Categories</option>
                {availableCategories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            {(selectedRemote || selectedCategory) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedRemote("");
                  setSelectedCategory("");
                }}
                className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer ml-auto"
              >
                Reset filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results List / Grid */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-7 h-7 text-blue-600 animate-spin" />
          <span className="text-sm font-medium text-gray-600">
            Loading opportunities closing on {formattedDateString}...
          </span>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-xs">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-800 mb-1">
            No opportunities found closing on this date
          </h2>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            There are currently no listings scheduled to close on {formattedDateString}. You can browse the full deadlines calendar or explore all active listings.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/deadlines"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors"
            >
              Return to Calendar
            </Link>
            <Link
              to="/opportunities"
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-sm rounded-xl transition-colors"
            >
              Browse All Opportunities
            </Link>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-xs">
          <p className="text-sm text-gray-600 mb-3">
            No opportunities match your selected filter for this date.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedRemote("");
              setSelectedCategory("");
            }}
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((opp) => (
            <OpportunityCard key={opp._id} opportunity={opp} />
          ))}
        </div>
      )}
    </div>
  );
}
