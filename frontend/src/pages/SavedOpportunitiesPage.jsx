import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useSaved } from "../context/SavedContext.jsx";
import OpportunityCard from "../components/OpportunityCard.jsx";
import { Bookmark, Compass, RefreshCw } from "lucide-react";

export default function SavedOpportunitiesPage() {
  const { token, user } = useAuth();
  const { savedIds } = useSaved();
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .get("/saved-opportunities", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setSavedItems(res.data.data || []);
      })
      .catch((err) => {
        console.error("Failed to load saved opportunities:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, savedIds]);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Bookmark className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to view saved opportunities</h2>
        <p className="text-gray-500 mb-6 text-sm">
          Bookmark internships, hackathons, and scholarships to easily revisit and track them.
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Bookmark className="w-7 h-7 text-blue-600 fill-blue-600" />
            Saved Opportunities
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Curated list of bookmarked listings matching your academic goals.
          </p>
        </div>

        <Link
          to="/opportunities"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:text-blue-600 text-xs font-semibold rounded-xl shadow-2xs hover:border-blue-400 transition-all self-start sm:self-auto"
        >
          <Compass className="w-4 h-4" /> Explore More
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-white border border-gray-200 rounded-2xl animate-pulse p-6" />
          ))}
        </div>
      ) : savedItems.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-2xs">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No saved opportunities yet</h3>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Click the bookmark icon on any opportunity card to save it here for quick access later.
          </p>
          <Link
            to="/opportunities"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md text-sm transition-all"
          >
            <Compass className="w-4 h-4" /> Discover Opportunities
          </Link>
        </div>
      ) : (
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            {savedItems.length} Saved {savedItems.length === 1 ? "Listing" : "Listings"}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedItems.map((item) => (
              <OpportunityCard key={item._id} opportunity={item.opportunityId} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
