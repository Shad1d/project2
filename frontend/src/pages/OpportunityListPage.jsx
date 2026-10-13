import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import OpportunityCard from "../components/OpportunityCard.jsx";
import toast from "react-hot-toast";
import {
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Navigation,
  X,
} from "lucide-react";

export const CANONICAL_CATEGORIES = [
  { slug: "internship", name: "Internship" },
  { slug: "job", name: "Job" },
  { slug: "scholarship", name: "Scholarship" },
  { slug: "hackathon", name: "Hackathon" },
  { slug: "competition", name: "Competition" },
  { slug: "fellowship", name: "Fellowship" },
  { slug: "grant", name: "Grant" },
  { slug: "research", name: "Research" },
  { slug: "conference", name: "Conference" },
];

export default function OpportunityListPage() {
  const { token, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [opportunities, setOpportunities] = useState([]);
  const [categories, setCategories] = useState(CANONICAL_CATEGORIES);
  const [loading, setLoading] = useState(true);

  // Filter & Search states initialized from URL
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedRemote, setSelectedRemote] = useState(searchParams.get("remoteType") || searchParams.get("remote") || "");
  const [selectedEducation, setSelectedEducation] = useState(searchParams.get("education") || "");
  const [selectedDistance, setSelectedDistance] = useState(searchParams.get("maxDistance") || "");
  const [selectedSort, setSelectedSort] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Location coordinates for distance & range matching
  const [userCoords, setUserCoords] = useState(() => {
    const latP = searchParams.get("lat");
    const lngP = searchParams.get("lng");
    if (latP && lngP) {
      return { lat: Number(latP), lng: Number(lngP) };
    }
    if (
      Array.isArray(user?.profile?.location?.coordinates) &&
      user.profile.location.coordinates.length === 2
    ) {
      return {
        lat: Number(user.profile.location.coordinates[1]),
        lng: Number(user.profile.location.coordinates[0]),
      };
    }
    return null;
  });

  const [locationName, setLocationName] = useState(user?.profile?.address || "");
  const [gpsLoading, setGpsLoading] = useState(false);

  // Auto-fill from user profile when user logs in
  useEffect(() => {
    if (
      !userCoords &&
      Array.isArray(user?.profile?.location?.coordinates) &&
      user.profile.location.coordinates.length === 2
    ) {
      setUserCoords({
        lat: Number(user.profile.location.coordinates[1]),
        lng: Number(user.profile.location.coordinates[0]),
      });
      if (user.profile.address) {
        setLocationName(user.profile.address);
      }
    }
  }, [user]);

  // Sync state if URL changes externally
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat !== null) setSelectedCategory(cat);
    const q = searchParams.get("search");
    if (q !== null) setSearch(q);
    const rem = searchParams.get("remoteType") || searchParams.get("remote");
    if (rem !== null) setSelectedRemote(rem);
    const edu = searchParams.get("education");
    if (edu !== null) setSelectedEducation(edu);
    const dist = searchParams.get("maxDistance");
    if (dist !== null) setSelectedDistance(dist);
    const s = searchParams.get("sort");
    if (s !== null) setSelectedSort(s);
  }, [searchParams]);

  // Fetch categories on mount
  useEffect(() => {
    api.get("/categories")
      .then((res) => {
        if (res.data.data && res.data.data.length > 0) {
          setCategories(res.data.data);
        }
      })
      .catch(() => {
        // Fallback remains CANONICAL_CATEGORIES
      });
  }, []);

  // Detect GPS location dynamically
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({
          lat: Number(latitude.toFixed(5)),
          lng: Number(longitude.toFixed(5)),
        });
        setLocationName("Current GPS Location");
        setGpsLoading(false);
        setPage(1);
        toast.success("Location detected for range matching!");
      },
      () => {
        setGpsLoading(false);
        toast.error("Could not access GPS. You can pin your location in Profile.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Fetch opportunities whenever query params or auth token change
  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        sort: selectedSort,
      };
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category = selectedCategory;
      if (selectedRemote) params.remoteType = selectedRemote;
      if (selectedEducation) params.education = selectedEducation;
      if (selectedDistance) params.maxDistance = selectedDistance;
      if (userCoords) {
        params.lat = userCoords.lat;
        params.lng = userCoords.lng;
      }

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await api.get("/opportunities", { params, headers });
      setOpportunities(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err) {
      console.error("Failed to load opportunities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [selectedCategory, selectedRemote, selectedEducation, selectedDistance, selectedSort, userCoords, page, token]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOpportunities();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Top Banner & Search */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
          Discover Opportunities
        </h1>
        <p className="text-gray-600 mb-6">
          Find student-focused internships, research positions, hackathons, and global scholarships.
        </p>

        {/* Search & Filters Bar */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-3 bg-white border border-gray-300 rounded-xl px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by keywords, skills, or organization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder-gray-400"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Filter Chips / Dropdowns */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="text-xs sm:text-sm font-medium border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Remote Filter */}
          <select
            value={selectedRemote}
            onChange={(e) => {
              setSelectedRemote(e.target.value);
              setPage(1);
            }}
            className="text-xs sm:text-sm font-medium border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Any Work Mode</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">On-site</option>
          </select>

          {/* Education Level */}
          <select
            value={selectedEducation}
            onChange={(e) => {
              setSelectedEducation(e.target.value);
              setPage(1);
            }}
            className="text-xs sm:text-sm font-medium border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Education Levels</option>
            <option value="HIGH_SCHOOL">High School</option>
            <option value="UNDERGRADUATE">Undergraduate</option>
            <option value="RECENT_GRADUATE">Recent Graduate</option>
            <option value="MASTERS">Master's</option>
            <option value="PHD">PhD</option>
          </select>

          {/* Distance Range Filter */}
          <select
            value={selectedDistance}
            onChange={(e) => {
              setSelectedDistance(e.target.value);
              setPage(1);
            }}
            className={`text-xs sm:text-sm font-medium border rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${
              selectedDistance
                ? "bg-blue-50 border-blue-400 text-blue-800 font-semibold"
                : "bg-white border-gray-300 text-gray-700"
            }`}
          >
            <option value="">Any Distance (Global)</option>
            <option value="10">Within 10 km (Local)</option>
            <option value="25">Within 25 km (Metro Area)</option>
            <option value="50">Within 50 km (Commutable)</option>
            <option value="100">Within 100 km (Regional)</option>
            <option value="250">Within 250 km (Statewide)</option>
          </select>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Sort by:</span>
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="text-xs sm:text-sm font-medium border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 outline-none focus:ring-1 focus:ring-blue-500"
          >
            {user && <option value="best_match">Best Match</option>}
            <option value="newest">Recently Published</option>
            <option value="nearest">Nearest Distance (📍 Closest)</option>
            <option value="deadline_soonest">Closing Soonest</option>
            <option value="recently_verified">Recently Verified</option>
          </select>
        </div>
      </div>

      {/* Location Status Bar */}
      {userCoords ? (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-blue-50/70 border border-blue-200/80 rounded-2xl px-4 py-2.5 mb-6 text-xs text-blue-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold">Matching From:</span>
            <span className="text-blue-800 truncate max-w-sm sm:max-w-md">
              {locationName || `Lat: ${userCoords.lat}, Lng: ${userCoords.lng}`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDetectGps}
              disabled={gpsLoading}
              className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
            >
              {gpsLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Navigation className="w-3.5 h-3.5" />
              )}
              Update GPS
            </button>
            <button
              type="button"
              onClick={() => {
                setUserCoords(null);
                setLocationName("");
                setSelectedDistance("");
              }}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
              title="Remove location filter"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 border border-gray-200/80 rounded-2xl px-4 py-2.5 mb-6 text-xs text-gray-600 shadow-2xs">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            <span>Enable your location or GPS to filter opportunities within your commutable range</span>
          </div>
          <button
            type="button"
            onClick={handleDetectGps}
            disabled={gpsLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            {gpsLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
            )}
            Detect My GPS Location
          </button>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-gray-700">
          Showing {opportunities.length} of {pagination.total} opportunities
        </span>
        {loading && (
          <span className="text-xs text-gray-400 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating...
          </span>
        )}
      </div>

      {/* Grid of Opportunities */}
      {loading && opportunities.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 h-48 animate-pulse flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-20 h-5 bg-gray-200 rounded"></div>
                <div className="w-3/4 h-6 bg-gray-200 rounded"></div>
                <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="w-full h-4 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center my-6">
          <h3 className="text-lg font-bold text-gray-800 mb-1">No opportunities found</h3>
          <p className="text-sm text-gray-500 mb-4">
            Try adjusting your search keywords or clearing some filters.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedCategory("");
              setSelectedRemote("");
              setSelectedEducation("");
            }}
            className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {opportunities.map((opp) => (
            <OpportunityCard key={opp._id} opportunity={opp} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-sm text-gray-600 font-medium">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
