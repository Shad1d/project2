import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import toast from "react-hot-toast";
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  Compass,
  FileText,
  Trash2,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

const STATUS_CONFIG = {
  INTERESTED: {
    label: "Interested",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  APPLIED: {
    label: "Applied",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  INTERVIEW: {
    label: "Interviewing",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  ACCEPTED: {
    label: "Accepted",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  REJECTED: {
    label: "Rejected",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
  WITHDRAWN: {
    label: "Withdrawn",
    badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

const TABS = ["ALL", "INTERESTED", "APPLIED", "INTERVIEW", "ACCEPTED", "REJECTED"];

export default function ApplicationsPage() {
  const { token, user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [notesText, setNotesText] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchApplications = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get("/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApplications(res.data.data || []);
    } catch (err) {
      console.error("Failed to load applications:", err);
      toast.error("Failed to load application tracker.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Handle status update
  const handleStatusChange = async (appId, newStatus) => {
    setUpdatingId(appId);
    try {
      const res = await api.patch(
        `/applications/${appId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApplications((prev) =>
        prev.map((app) => (app._id === appId ? res.data.data : app))
      );
      toast.success(`Moved to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle notes save
  const handleSaveNotes = async (appId) => {
    try {
      const res = await api.patch(
        `/applications/${appId}`,
        { notes: notesText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApplications((prev) =>
        prev.map((app) => (app._id === appId ? res.data.data : app))
      );
      setEditingNotesId(null);
      toast.success("Notes saved.");
    } catch (err) {
      toast.error("Failed to save notes.");
    }
  };

  // Handle delete application
  const handleDelete = async (appId) => {
    if (!window.confirm("Remove this opportunity from your application tracker?")) return;
    try {
      await api.delete(`/applications/${appId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApplications((prev) => prev.filter((app) => app._id !== appId));
      toast.success("Application removed from tracker.");
    } catch (err) {
      toast.error("Failed to delete application record.");
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to track applications</h2>
        <p className="text-gray-500 mb-6 text-sm">
          Keep track of your job, internship, and scholarship submissions with stages and personal notes.
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

  // Filter applications by tab
  const filteredApps =
    activeTab === "ALL"
      ? applications
      : applications.filter((app) => app.status === activeTab);

  // Tab counts
  const getTabCount = (tab) => {
    if (tab === "ALL") return applications.length;
    return applications.filter((app) => app.status === tab).length;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-7 h-7 text-blue-600" />
            Application Tracker
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Organize, update, and manage your opportunity applications from discovery to offer.
          </p>
        </div>

        <Link
          to="/opportunities"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:text-blue-600 text-xs font-semibold rounded-xl shadow-2xs hover:border-blue-400 transition-all self-start sm:self-auto"
        >
          <Compass className="w-4 h-4" /> Find Opportunities
        </Link>
      </div>

      {/* Status Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-gray-200">
        {TABS.map((tab) => {
          const count = getTabCount(tab);
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              <span>{tab === "ALL" ? "All Applications" : STATUS_CONFIG[tab]?.label || tab}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-2xs ${
                  isActive ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white border border-gray-200 rounded-2xl animate-pulse p-6" />
          ))}
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-2xs">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {activeTab === "ALL" ? "No applications tracked yet" : `No applications in ${STATUS_CONFIG[activeTab]?.label || activeTab}`}
          </h3>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Open any opportunity and select "Track Application" to organize your submission timeline and notes.
          </p>
          <Link
            to="/opportunities"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md text-sm transition-all"
          >
            <Compass className="w-4 h-4" /> Discover Opportunities
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => {
            const opp = app.opportunityId;
            if (!opp) return null;
            const isEditing = editingNotesId === app._id;
            const currentConfig = STATUS_CONFIG[app.status] || STATUS_CONFIG.INTERESTED;

            return (
              <div
                key={app._id}
                className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 shadow-2xs transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  {/* Title & Organization */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-2.5 py-0.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg">
                        {opp.categoryId?.name || "Opportunity"}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 text-xs font-bold border rounded-lg ${currentConfig.badgeClass}`}
                      >
                        {currentConfig.label}
                      </span>
                      {app.appliedAt && (
                        <span className="text-2xs text-gray-400">
                          Applied: {new Date(app.appliedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <Link
                      to={`/opportunities/${opp._id}`}
                      className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1 inline-block"
                    >
                      {opp.title}
                    </Link>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{opp.organizationName}</span>
                    </div>
                  </div>

                  {/* Actions & Status Select */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <label className="text-xs text-gray-500 font-medium">Stage:</label>
                    <select
                      value={app.status}
                      disabled={updatingId === app._id}
                      onChange={(e) => handleStatusChange(app._id, e.target.value)}
                      className="text-xs font-semibold border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      {Object.keys(STATUS_CONFIG).map((st) => (
                        <option key={st} value={st}>
                          {STATUS_CONFIG[st].label}
                        </option>
                      ))}
                    </select>

                    {opp.applicationUrl && (
                      <a
                        href={opp.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Open official application portal"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(app._id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove from tracker"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="border-t border-gray-100 pt-3">
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={notesText}
                        onChange={(e) => setNotesText(e.target.value)}
                        placeholder="Add notes (e.g. interview dates, referral name, essay requirements)..."
                        rows={3}
                        className="w-full text-xs sm:text-sm p-3 border border-gray-300 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setEditingNotesId(null)}
                          className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveNotes(app._id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                          Save Notes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-2 text-xs text-gray-600 flex-1">
                        <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                        <span className="italic">
                          {app.notes ? app.notes : "No personal notes added yet."}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNotesId(app._id);
                          setNotesText(app.notes || "");
                        }}
                        className="text-2xs font-semibold text-blue-600 hover:underline shrink-0 cursor-pointer"
                      >
                        {app.notes ? "Edit Notes" : "+ Add Note"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
