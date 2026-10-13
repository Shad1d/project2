import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import toast from "react-hot-toast";
import {
  ShieldCheck,
  AlertTriangle,
  FilePlus,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Trash2,
  ShieldAlert,
  ArrowLeft,
  Building2,
  Send,
  MapPin,
  Pencil,
  X,
} from "lucide-react";
import LocationPickerMap from "../components/LocationPickerMap.jsx";

export default function AdminPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("reports");

  // Reports state
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Listings state
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);

  // Edit Opportunity Modal state
  const [editingOpp, setEditingOpp] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Categories for Publish form
  const [categories, setCategories] = useState([]);

  // Publish Form State
  const [publishForm, setPublishForm] = useState({
    title: "",
    organizationName: "",
    categoryId: "",
    description: "",
    applicationUrl: "",
    remoteType: "REMOTE",
    city: "",
    country: "US",
    address: "",
    location: null, // { lat, lng }
    deadlineStatus: "FIXED",
    deadline: "",
    educationLevels: ["UNDERGRADUATE"],
    experienceLevel: "ENTRY",
    fundingType: "PAID",
    stipendAmount: "",
    currency: "USD",
  });
  const [publishing, setPublishing] = useState(false);

  // Fetch reports queue
  const fetchReports = useCallback(async () => {
    if (!token) return;
    setReportsLoading(true);
    try {
      const res = await api.get("/reports?status=OPEN", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(res.data.data || []);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setReportsLoading(false);
    }
  }, [token]);

  // Fetch listings queue
  const fetchListings = useCallback(async () => {
    if (!token) return;
    setListingsLoading(true);
    try {
      const res = await api.get("/opportunities/admin/queue?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setListings(res.data.data || []);
    } catch (err) {
      console.error("Failed to load listings:", err);
    } finally {
      setListingsLoading(false);
    }
  }, [token]);

  // Fetch categories
  useEffect(() => {
    api.get("/categories").then((res) => {
      const cats = res.data.data || [];
      setCategories(cats);
      if (cats.length > 0 && !publishForm.categoryId) {
        setPublishForm((prev) => ({ ...prev, categoryId: cats[0]._id }));
      }
    });
  }, []);

  useEffect(() => {
    if (activeTab === "reports") fetchReports();
    if (activeTab === "listings") fetchListings();
  }, [activeTab, fetchReports, fetchListings]);

  // Role verification check
  const isAuthorized = user?.role === "ADMIN" || user?.role === "MODERATOR";

  if (!user || !isAuthorized) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-gray-500 mb-6 text-sm">
          You must be signed in with an Administrator or Moderator account to access the verification portal.
        </p>
        <Link
          to="/opportunities"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm text-sm"
        >
          Back to Opportunities
        </Link>
      </div>
    );
  }

  // Handle report resolution
  const handleResolveReport = async (reportId, status, action = null) => {
    try {
      await api.patch(
        `/reports/${reportId}`,
        { status, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Report marked as ${status}.`);
      setReports((prev) => prev.filter((r) => r._id !== reportId));
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Failed to resolve report.");
    }
  };

  // Handle listing verification toggle
  const handleVerifyListing = async (oppId) => {
    try {
      const res = await api.patch(
        `/opportunities/${oppId}`,
        { verificationStatus: "VERIFIED" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Listing verified and checked timestamp updated.");
      setListings((prev) =>
        prev.map((item) => (item._id === oppId ? res.data.data : item))
      );
    } catch (err) {
      toast.error("Failed to verify listing.");
    }
  };

  // Handle listing status expire
  const handleExpireListing = async (oppId) => {
    try {
      const res = await api.patch(
        `/opportunities/${oppId}`,
        { status: "EXPIRED" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Listing marked as EXPIRED.");
      setListings((prev) =>
        prev.map((item) => (item._id === oppId ? res.data.data : item))
      );
    } catch (err) {
      toast.error("Failed to expire listing.");
    }
  };

  // Handle listing delete
  const handleDeleteListing = async (oppId) => {
    if (!window.confirm("Permanently delete this opportunity listing?")) return;
    try {
      await api.delete(`/opportunities/${oppId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Listing permanently deleted.");
      setListings((prev) => prev.filter((item) => item._id !== oppId));
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Failed to delete listing.");
    }
  };

  // Start editing an opportunity
  const startEditOpportunity = (item) => {
    setEditingOpp(item);
    setEditForm({
      title: item.title || "",
      organizationName: item.organizationName || "",
      categoryId: item.categoryId?._id || item.categoryId || "",
      description: item.description || "",
      applicationUrl: item.applicationUrl || "",
      remoteType: item.remoteType || "REMOTE",
      city: item.city || "",
      country: item.country || "US",
      address: item.address || "",
      location:
        Array.isArray(item.location?.coordinates) && item.location.coordinates.length === 2
          ? { lat: item.location.coordinates[1], lng: item.location.coordinates[0] }
          : null,
      deadlineStatus: item.deadlineStatus || "FIXED",
      deadline: item.deadline ? new Date(item.deadline).toISOString().split("T")[0] : "",
      status: item.status || "PUBLISHED",
      verificationStatus: item.verificationStatus || "UNVERIFIED",
      fundingType: item.fundingType || "PAID",
      stipendAmount:
        item.stipendAmount !== null && item.stipendAmount !== undefined
          ? String(item.stipendAmount)
          : "",
      currency: item.currency || "USD",
    });
  };

  // Submit update for opportunity
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingOpp || !editForm) return;

    if (!editForm.description || editForm.description.trim().length < 20) {
      toast.error(
        `Description must be at least 20 characters long (currently ${
          editForm.description ? editForm.description.trim().length : 0
        } characters).`
      );
      return;
    }

    setUpdating(true);
    try {
      const payload = {
        title: editForm.title.trim(),
        organizationName: editForm.organizationName.trim(),
        categoryId: editForm.categoryId,
        description: editForm.description.trim(),
        applicationUrl: editForm.applicationUrl.trim(),
        remoteType: editForm.remoteType,
        country: editForm.country ? editForm.country.toUpperCase().trim() : null,
        city: editForm.city ? editForm.city.trim() : null,
        address: editForm.address ? editForm.address.trim() : null,
        location: editForm.location,
        deadlineStatus: editForm.deadlineStatus,
        deadline: editForm.deadline || null,
        status: editForm.status,
        verificationStatus: editForm.verificationStatus,
        fundingType: editForm.fundingType,
        stipendAmount: editForm.stipendAmount ? Number(editForm.stipendAmount) : null,
        currency: editForm.currency,
      };

      const res = await api.patch(`/opportunities/${editingOpp._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Opportunity updated successfully.");
      setListings((prev) =>
        prev.map((item) => (item._id === editingOpp._id ? res.data.data : item))
      );
      setEditingOpp(null);
      setEditForm(null);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Failed to update opportunity.");
    } finally {
      setUpdating(false);
    }
  };

  // Handle publish form submit
  const handlePublishSubmit = async (e) => {
    e.preventDefault();

    if (!publishForm.description || publishForm.description.trim().length < 20) {
      toast.error(
        `Description must be at least 20 characters long (currently ${
          publishForm.description ? publishForm.description.trim().length : 0
        } characters).`
      );
      return;
    }

    setPublishing(true);
    try {
      const payload = {
        ...publishForm,
        stipendAmount: publishForm.stipendAmount ? Number(publishForm.stipendAmount) : null,
      };
      const res = await api.post("/opportunities", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Opportunity published successfully!");
      // Reset form
      setPublishForm({
        title: "",
        organizationName: "",
        categoryId: categories[0]?._id || "",
        description: "",
        applicationUrl: "",
        remoteType: "REMOTE",
        city: "",
        country: "US",
        deadlineStatus: "FIXED",
        deadline: "",
        educationLevels: ["UNDERGRADUATE"],
        experienceLevel: "ENTRY",
        fundingType: "PAID",
        stipendAmount: "",
        currency: "USD",
      });
      setActiveTab("listings");
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Failed to publish listing.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
            Verification & Admin Portal
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage listings quality, resolve community flags, and publish student opportunities.
          </p>
        </div>

        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 self-start sm:self-auto">
          Role: {user.role}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 mb-8">
        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "reports"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Reports Queue</span>
          <span className="px-1.5 py-0.2 rounded-full text-2xs bg-black/20">
            {reports.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("listings")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "listings"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Listing Management</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("publish")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "publish"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200"
          }`}
        >
          <FilePlus className="w-4 h-4" />
          <span>Publish Listing</span>
        </button>
      </div>

      {/* TAB 1: Reports Queue */}
      {activeTab === "reports" && (
        <div>
          {reportsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-white border border-gray-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center max-w-md mx-auto shadow-2xs">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">Queue is Clear</h3>
              <p className="text-xs text-gray-500">
                No open community reports are currently awaiting review.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => {
                const opp = report.opportunityId;
                return (
                  <div
                    key={report._id}
                    className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 shadow-2xs transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-md">
                          {report.reason.replace(/_/g, " ")}
                        </span>
                        <span className="text-2xs text-gray-400">
                          Reported by {report.userId?.displayName || "Student"} · {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleResolveReport(report._id, "DISMISSED")}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Dismiss
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveReport(report._id, "RESOLVED")}
                          className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Mark Resolved
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveReport(report._id, "RESOLVED", "EXPIRE_OPPORTUNITY")}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Expire Listing
                        </button>
                      </div>
                    </div>

                    {opp ? (
                      <div>
                        <Link
                          to={`/opportunities/${opp._id}`}
                          className="text-base font-bold text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {opp.title}
                        </Link>
                        <div className="text-xs text-gray-500 mt-0.5">{opp.organizationName}</div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Listing was removed</span>
                    )}

                    {report.description && (
                      <div className="mt-3 p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-700">
                        "{report.description}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Listing Management */}
      {activeTab === "listings" && (
        <div>
          {listingsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-white border border-gray-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-5 py-3">Listing</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Verification</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {listings.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <Link
                            to={`/opportunities/${item._id}`}
                            className="font-bold text-gray-900 hover:text-blue-600 line-clamp-1 block text-sm"
                          >
                            {item.title}
                          </Link>
                          <span className="text-gray-400">{item.organizationName}</span>
                        </td>
                        <td className="px-4 py-4 font-medium text-gray-600">
                          {item.categoryId?.name || "General"}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-2xs ${
                              item.verificationStatus === "VERIFIED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : item.verificationStatus === "FLAGGED"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {item.verificationStatus}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-2xs ${
                              item.status === "PUBLISHED"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEditOpportunity(item)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-2xs font-semibold cursor-pointer inline-flex items-center gap-1"
                              title="Edit Opportunity"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            {item.verificationStatus !== "VERIFIED" && (
                              <button
                                type="button"
                                onClick={() => handleVerifyListing(item._id)}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-2xs font-bold cursor-pointer"
                              >
                                Verify
                              </button>
                            )}

                            {item.status === "PUBLISHED" && (
                              <button
                                type="button"
                                onClick={() => handleExpireListing(item._id)}
                                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-2xs font-semibold cursor-pointer"
                              >
                                Expire
                              </button>
                            )}

                            {user.role === "ADMIN" && (
                              <button
                                type="button"
                                onClick={() => handleDeleteListing(item._id)}
                                className="p-1 text-gray-400 hover:text-rose-600 rounded cursor-pointer"
                                title="Delete Listing"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Publish Listing Form */}
      {activeTab === "publish" && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-2xs max-w-3xl mx-auto">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-gray-900">Publish New Opportunity</h2>
            <p className="text-xs text-gray-500 mt-1">
              Add verified internships, hackathons, and global scholarships directly into the student discovery feed.
            </p>
          </div>

          <form onSubmit={handlePublishSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Opportunity Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google Summer of Code 2027"
                  value={publishForm.title}
                  onChange={(e) => setPublishForm({ ...publishForm, title: e.target.value })}
                  className="w-full text-xs sm:text-sm p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google Open Source"
                  value={publishForm.organizationName}
                  onChange={(e) => setPublishForm({ ...publishForm, organizationName: e.target.value })}
                  className="w-full text-xs sm:text-sm p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={publishForm.categoryId}
                  onChange={(e) => setPublishForm({ ...publishForm, categoryId: e.target.value })}
                  className="w-full text-xs sm:text-sm p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Work Mode
                </label>
                <select
                  value={publishForm.remoteType}
                  onChange={(e) => setPublishForm({ ...publishForm, remoteType: e.target.value })}
                  className="w-full text-xs sm:text-sm p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONSITE">On-site</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Country Code (2 letters)
                </label>
                <input
                  type="text"
                  maxLength={2}
                  placeholder="US, DE, GB"
                  value={publishForm.country}
                  onChange={(e) => setPublishForm({ ...publishForm, country: e.target.value.toUpperCase() })}
                  className="w-full text-xs sm:text-sm p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Location Map Picker for On-site & Hybrid Opportunities */}
            {publishForm.remoteType !== "REMOTE" && (
              <div className="pt-2 pb-2">
                <LocationPickerMap
                  coords={publishForm.location}
                  address={publishForm.address}
                  label="Pinpoint Venue / Campus Location (For Radius Matching)"
                  onChange={({ lat, lng, address: newAddr, city: newCity, countryCode }) => {
                    setPublishForm((prev) => ({
                      ...prev,
                      location: { lat, lng },
                      address: newAddr,
                      city: newCity || prev.city,
                      country: countryCode || prev.country,
                    }));
                  }}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Official Application URL *
              </label>
              <input
                type="url"
                required
                placeholder="https://..."
                value={publishForm.applicationUrl}
                onChange={(e) => setPublishForm({ ...publishForm, applicationUrl: e.target.value })}
                className="w-full text-xs sm:text-sm p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Deadline Status
                </label>
                <select
                  value={publishForm.deadlineStatus}
                  onChange={(e) => setPublishForm({ ...publishForm, deadlineStatus: e.target.value })}
                  className="w-full text-xs sm:text-sm p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="FIXED">Fixed Date</option>
                  <option value="OPEN_UNTIL_FILLED">Open until filled</option>
                  <option value="NO_DEADLINE">No deadline (Rolling)</option>
                </select>
              </div>

              {publishForm.deadlineStatus === "FIXED" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Deadline Date
                  </label>
                  <input
                    type="date"
                    required
                    value={publishForm.deadline}
                    onChange={(e) => setPublishForm({ ...publishForm, deadline: e.target.value })}
                    className="w-full text-xs sm:text-sm p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Detailed Description *
                </label>
                <span
                  className={`text-2xs font-semibold ${
                    publishForm.description.trim().length >= 20 ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {publishForm.description.trim().length} / 20 min characters
                </span>
              </div>
              <textarea
                required
                rows={5}
                placeholder="Overview, eligibility, responsibilities, and benefits (minimum 20 characters)..."
                value={publishForm.description}
                onChange={(e) => setPublishForm({ ...publishForm, description: e.target.value })}
                className={`w-full text-xs sm:text-sm p-3 border rounded-xl outline-none focus:ring-2 ${
                  publishForm.description.length > 0 && publishForm.description.trim().length < 20
                    ? "border-amber-400 focus:ring-amber-400 bg-amber-50/20"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {publishForm.description.length > 0 && publishForm.description.trim().length < 20 && (
                <p className="text-2xs text-amber-600 mt-1 font-medium flex items-center gap-1">
                  ⚠ Description must be at least 20 characters long ({20 - publishForm.description.trim().length} more needed).
                </p>
              )}
            </div>

            <div className="pt-4 flex items-center justify-end">
              <button
                type="submit"
                disabled={publishing}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all text-sm cursor-pointer flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {publishing ? "Publishing..." : "Publish Verified Listing"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT OPPORTUNITY MODAL */}
      {editingOpp && editForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div>
                <span className="text-2xs font-bold text-blue-600 uppercase tracking-wider">
                  Admin Modification
                </span>
                <h3 className="text-xl font-bold text-gray-900">Edit Opportunity Listing</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingOpp(null);
                  setEditForm(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Organization</label>
                  <input
                    type="text"
                    required
                    value={editForm.organizationName}
                    onChange={(e) => setEditForm({ ...editForm, organizationName: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={editForm.categoryId}
                    onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Publication Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                  >
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="PENDING_REVIEW">PENDING_REVIEW</option>
                    <option value="EXPIRED">EXPIRED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Verification Status</label>
                  <select
                    value={editForm.verificationStatus}
                    onChange={(e) => setEditForm({ ...editForm, verificationStatus: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white font-bold"
                  >
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="UNVERIFIED">UNVERIFIED</option>
                    <option value="REVIEWED">REVIEWED</option>
                    <option value="FLAGGED">FLAGGED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Workplace Mode</label>
                  <select
                    value={editForm.remoteType}
                    onChange={(e) => setEditForm({ ...editForm, remoteType: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="ONSITE">On-Site</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Country Code</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={editForm.country}
                    onChange={(e) => setEditForm({ ...editForm, country: e.target.value.toUpperCase() })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Location Picker Map for Onsite & Hybrid */}
              {editForm.remoteType !== "REMOTE" && (
                <div className="pt-2">
                  <LocationPickerMap
                    coords={editForm.location}
                    address={editForm.address}
                    label="Pin Venue Location & Address"
                    onChange={({ lat, lng, address: addr, city: c, countryCode }) => {
                      setEditForm((prev) => ({
                        ...prev,
                        location: { lat, lng },
                        address: addr || prev.address,
                        city: c || prev.city,
                        country: countryCode || prev.country,
                      }));
                    }}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Deadline Type</label>
                  <select
                    value={editForm.deadlineStatus}
                    onChange={(e) => setEditForm({ ...editForm, deadlineStatus: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="FIXED">Fixed Deadline Date</option>
                    <option value="OPEN_UNTIL_FILLED">Open Until Filled (Rolling)</option>
                    <option value="NO_DEADLINE">No Deadline</option>
                  </select>
                </div>
                {editForm.deadlineStatus === "FIXED" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Deadline Date</label>
                    <input
                      type="date"
                      value={editForm.deadline}
                      onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Funding</label>
                  <select
                    value={editForm.fundingType}
                    onChange={(e) => setEditForm({ ...editForm, fundingType: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="PAID">Paid</option>
                    <option value="FULLY_FUNDED">Fully Funded</option>
                    <option value="PARTIALLY_FUNDED">Partially Funded</option>
                    <option value="UNPAID">Unpaid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Stipend Amount</label>
                  <input
                    type="number"
                    value={editForm.stipendAmount}
                    onChange={(e) => setEditForm({ ...editForm, stipendAmount: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Currency</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={editForm.currency}
                    onChange={(e) => setEditForm({ ...editForm, currency: e.target.value.toUpperCase() })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Official Application URL</label>
                <input
                  type="url"
                  required
                  value={editForm.applicationUrl}
                  onChange={(e) => setEditForm({ ...editForm, applicationUrl: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Description *
                  </label>
                  <span
                    className={`text-2xs font-semibold ${
                      editForm.description.trim().length >= 20 ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {editForm.description.trim().length} / 20 min characters
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  placeholder="Overview, eligibility, and details (minimum 20 characters)..."
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className={`w-full text-xs sm:text-sm p-3 border rounded-xl outline-none focus:ring-2 ${
                    editForm.description.length > 0 && editForm.description.trim().length < 20
                      ? "border-amber-400 focus:ring-amber-400 bg-amber-50/20"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                {editForm.description.length > 0 && editForm.description.trim().length < 20 && (
                  <p className="text-2xs text-amber-600 mt-1 font-medium flex items-center gap-1">
                    ⚠ Description must be at least 20 characters long ({20 - editForm.description.trim().length} more needed).
                  </p>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingOpp(null);
                    setEditForm(null);
                  }}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-all text-xs cursor-pointer"
                >
                  {updating ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
