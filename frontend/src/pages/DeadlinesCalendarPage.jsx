import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api.js";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowRight,
  Sparkles,
  Filter,
  CheckCircle2,
  AlertCircle,
  Building2,
  MapPin,
  RefreshCw,
} from "lucide-react";

// Format date to YYYY-MM-DD using local timezone
export const formatDateKey = (dateInput) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Color scale according to the number of jobs closing on that date
export const getDeadlineColorStyle = (count) => {
  if (!count || count <= 0) {
    return {
      bg: "bg-white hover:bg-slate-50",
      border: "border-gray-200",
      text: "text-gray-700",
      badge: "hidden",
      dot: "bg-gray-300",
      level: "none",
    };
  }
  if (count === 1) {
    return {
      bg: "bg-emerald-50/90 hover:bg-emerald-100/90",
      border: "border-emerald-300 ring-1 ring-emerald-300/80 shadow-xs",
      text: "text-emerald-950 font-semibold",
      badge: "bg-emerald-100 text-emerald-800 border border-emerald-300",
      dot: "bg-emerald-500",
      level: "low",
      label: "1 deadline",
    };
  }
  if (count <= 3) {
    return {
      bg: "bg-amber-50/90 hover:bg-amber-100/90",
      border: "border-amber-400 ring-1 ring-amber-400 shadow-xs",
      text: "text-amber-950 font-bold",
      badge: "bg-amber-200 text-amber-900 border border-amber-400 font-semibold",
      dot: "bg-amber-500",
      level: "medium",
      label: `${count} deadlines`,
    };
  }
  // 4 or more jobs
  return {
    bg: "bg-rose-50/90 hover:bg-rose-100/90",
    border: "border-rose-400 ring-2 ring-rose-400/90 shadow-sm",
    text: "text-rose-950 font-bold",
    badge: "bg-rose-200 text-rose-950 border border-rose-400 font-bold",
    dot: "bg-rose-600",
    level: "high",
    label: `${count} deadlines`,
  };
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DeadlinesCalendarPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [opportunities, setOpportunities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch all opportunities with deadlines and categories
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        // Fetch categories
        api.get("/categories").then((res) => {
          if (isMounted && res.data.data) {
            setCategories(res.data.data);
          }
        }).catch(() => {});

        // Fetch opportunities sorted by deadline
        const res = await api.get("/opportunities", {
          params: { limit: 100, sort: "deadline_soonest" },
        });

        let allOpps = res.data.data || [];

        // If pagination indicates more than 1 page, load remaining pages
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
          // Filter down to opportunities that have a valid deadline
          const withDeadlines = allOpps.filter(
            (opp) => opp.deadline && !isNaN(new Date(opp.deadline).getTime())
          );
          setOpportunities(withDeadlines);
        }
      } catch (err) {
        console.error("Failed to load deadline opportunities:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter opportunities by selected category if any
  const filteredOpportunities = useMemo(() => {
    if (!selectedCategory) return opportunities;
    return opportunities.filter((opp) => {
      const catSlug = opp.categoryId?.slug || opp.categoryId;
      return catSlug === selectedCategory;
    });
  }, [opportunities, selectedCategory]);

  // Group opportunities by date string (YYYY-MM-DD)
  const deadlinesByDate = useMemo(() => {
    const map = {};
    filteredOpportunities.forEach((opp) => {
      const key = formatDateKey(opp.deadline);
      if (key) {
        if (!map[key]) map[key] = [];
        map[key].push(opp);
      }
    });
    return map;
  }, [filteredOpportunities]);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday

    const days = [];

    // Trailing days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: d,
        dayNum: d.getDate(),
        dateKey: formatDateKey(d),
        isCurrentMonth: false,
      });
    }

    // Days in current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        dayNum: i,
        dateKey: formatDateKey(d),
        isCurrentMonth: true,
      });
    }

    // Leading days from next month to complete the row
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        dayNum: i,
        dateKey: formatDateKey(d),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  // Quick stats calculations
  const todayKey = formatDateKey(new Date());
  const stats = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const currYear = currentDate.getFullYear();
    const currMonth = currentDate.getMonth();

    let thisMonthCount = 0;
    let next7DaysCount = 0;
    let totalUpcoming = 0;

    filteredOpportunities.forEach((opp) => {
      const d = new Date(opp.deadline);
      if (d >= now) {
        totalUpcoming++;
      }
      if (d >= now && d <= sevenDaysLater) {
        next7DaysCount++;
      }
      if (d.getFullYear() === currYear && d.getMonth() === currMonth) {
        thisMonthCount++;
      }
    });

    return { thisMonthCount, next7DaysCount, totalUpcoming };
  }, [filteredOpportunities, currentDate]);

  // List of opportunities closing in currently viewed month, sorted by date
  const monthOpportunities = useMemo(() => {
    const currYear = currentDate.getFullYear();
    const currMonth = currentDate.getMonth();

    return filteredOpportunities
      .filter((opp) => {
        const d = new Date(opp.deadline);
        return d.getFullYear() === currYear && d.getMonth() === currMonth;
      })
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }, [filteredOpportunities, currentDate]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleJumpToToday = () => {
    setCurrentDate(new Date());
  };

  const monthYearLabel = currentDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
          <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
          <span>Application Deadlines Tracker</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
          Opportunity Deadlines
        </h1>
        <p className="mt-2 text-base text-gray-600 max-w-2xl">
          Keep track of closing dates for internships, scholarships, and fellowships. Click any highlighted date to explore all opportunities with that specific deadline.
        </p>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500 block">Closing This Month</span>
              <span className="text-2xl font-bold text-gray-900">{stats.thisMonthCount}</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500 block">Next 7 Days (Urgent)</span>
              <span className="text-2xl font-bold text-amber-700">{stats.next7DaysCount}</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500 block">Total Active Deadlines</span>
              <span className="text-2xl font-bold text-gray-900">{stats.totalUpcoming}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Controls & Color Legend */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white text-gray-700 hover:text-gray-900 rounded-lg transition-colors cursor-pointer"
              title="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-3 text-base font-bold text-gray-900 min-w-36 text-center select-none">
              {monthYearLabel}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white text-gray-700 hover:text-gray-900 rounded-lg transition-colors cursor-pointer"
              title="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleJumpToToday}
            className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>

        {/* Category Filter & Color Legend */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs sm:text-sm font-medium border border-gray-300 rounded-xl px-3 py-1.5 bg-white text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Color Highlight Legend */}
          <div className="flex items-center gap-3 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
            <span className="text-gray-500 font-semibold mr-1">Intensity:</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              1 job
            </span>
            <span className="inline-flex items-center gap-1.5 text-amber-800">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              2-3 jobs
            </span>
            <span className="inline-flex items-center gap-1.5 text-rose-800">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              4+ jobs
            </span>
          </div>
        </div>
      </div>

      {/* Main Calendar Grid */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden mb-8">
        {/* Weekday Header */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/80 text-center text-xs font-bold text-gray-600 py-3">
          {WEEKDAYS.map((day) => (
            <div key={day} className="tracking-wide">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        {loading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-7 h-7 text-blue-600 animate-spin" />
            <span className="text-sm font-medium text-gray-600">Loading opportunity deadlines...</span>
          </div>
        ) : (
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-gray-100">
            {calendarDays.map((day, idx) => {
              const dayDeadlines = deadlinesByDate[day.dateKey] || [];
              const count = dayDeadlines.length;
              const hasDeadlines = count > 0;
              const colorStyle = getDeadlineColorStyle(count);
              const isToday = day.dateKey === todayKey;

              return (
                <div
                  key={`${day.dateKey}-${idx}`}
                  onClick={() => {
                    if (hasDeadlines) {
                      navigate(`/deadlines/${day.dateKey}`);
                    }
                  }}
                  className={`min-h-24 sm:min-h-28 p-2 sm:p-2.5 flex flex-col justify-between transition-all duration-150 ${
                    colorStyle.bg
                  } ${
                    hasDeadlines
                      ? `${colorStyle.border} cursor-pointer group hover:shadow-md hover:scale-[1.01] hover:z-10`
                      : "cursor-default"
                  } ${!day.isCurrentMonth ? "opacity-35 bg-gray-50/40" : ""}`}
                >
                  {/* Top Bar of Day Cell */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs sm:text-sm font-semibold inline-flex items-center justify-center rounded-full transition-colors ${
                        isToday
                          ? "w-6 h-6 bg-blue-600 text-white font-bold shadow-xs"
                          : hasDeadlines
                          ? colorStyle.text
                          : day.isCurrentMonth
                          ? "text-gray-800"
                          : "text-gray-400"
                      }`}
                    >
                      {day.dayNum}
                    </span>

                    {/* Count Badge on highlighted dates */}
                    {hasDeadlines && (
                      <span
                        className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${colorStyle.badge}`}
                        title={`${count} job deadline${count > 1 ? "s" : ""} on ${day.dateKey}`}
                      >
                        {count} {count === 1 ? "job" : "jobs"}
                      </span>
                    )}
                  </div>

                  {/* Opportunities Previews (if any) */}
                  {hasDeadlines ? (
                    <div className="space-y-1 mt-1 overflow-hidden">
                      {dayDeadlines.slice(0, 2).map((opp) => (
                        <div
                          key={opp._id}
                          className="text-[11px] leading-tight text-gray-800 truncate rounded px-1.5 py-0.5 bg-white/70 border border-black/5 group-hover:bg-white transition-colors"
                          title={`${opp.title} (${opp.organizationName})`}
                        >
                          <span className="font-semibold text-gray-900">{opp.title}</span>
                        </div>
                      ))}
                      {count > 2 && (
                        <span className="text-[10px] text-gray-500 font-medium pl-1 block">
                          +{count - 2} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="h-6"></div>
                  )}

                  {/* Bottom hover prompt */}
                  {hasDeadlines && (
                    <div className="mt-1 pt-1 border-t border-black/5 flex items-center justify-between text-[10px] font-semibold text-gray-500 group-hover:text-blue-600 transition-colors">
                      <span>View all {count}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Month Deadlines Summary Feed */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                All Deadlines in {monthYearLabel}
              </h2>
              <p className="text-xs text-gray-500">
                {monthOpportunities.length} opportunities closing this month
              </p>
            </div>
          </div>

          <Link
            to="/opportunities"
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            Browse all opportunities <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {monthOpportunities.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <CheckCircle2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">
              No opportunity deadlines recorded in {monthYearLabel}.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Check adjacent months or adjust your category filter above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monthOpportunities.map((opp) => {
              const dl = new Date(opp.deadline);
              const dateKey = formatDateKey(opp.deadline);
              const dayStr = dl.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={opp._id}
                  onClick={() => navigate(`/deadlines/${dateKey}`)}
                  className="group bg-white border border-gray-200 hover:border-blue-400 rounded-xl p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3 text-rose-600" />
                        {dayStr}
                      </span>
                      <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {opp.categoryId?.name || "Opportunity"}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1">
                      {opp.title}
                    </h3>
                    <p className="text-xs text-gray-600 flex items-center gap-1 line-clamp-1 mb-2">
                      <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      {opp.organizationName}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium">
                      {opp.remoteType || "On-site"}
                    </span>
                    <span className="text-blue-600 font-semibold group-hover:underline flex items-center gap-1">
                      View date list <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
