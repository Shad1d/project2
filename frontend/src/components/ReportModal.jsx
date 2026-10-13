import React, { useState } from "react";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import toast from "react-hot-toast";
import { Flag, X, AlertTriangle, Send } from "lucide-react";

const REASONS = [
  { value: "EXPIRED", label: "Deadline has passed / Listing is closed" },
  { value: "BROKEN_LINK", label: "Application link is broken (404 / inactive)" },
  { value: "INCORRECT_INFORMATION", label: "Eligibility or stipend info is inaccurate" },
  { value: "SUSPICIOUS_SCAM", label: "Suspicious listing / fee requested / potential scam" },
  { value: "DUPLICATE", label: "Duplicate of another listing" },
  { value: "OTHER", label: "Other problem" },
];

export default function ReportModal({ opportunityId, opportunityTitle, isOpen, onClose }) {
  const { token, user } = useAuth();
  const [reason, setReason] = useState("EXPIRED");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Please sign in to report a listing.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(
        "/reports",
        {
          opportunityId,
          reason,
          description: description.trim() || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success(res.data.message || "Report submitted. Thank you!");
      setDescription("");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
            <Flag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Report Listing</h3>
            <p className="text-xs text-gray-500 line-clamp-1">{opportunityTitle}</p>
          </div>
        </div>

        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
          Help the student community maintain accurate and verified listings. Submissions are reviewed by our team.
        </p>

        {/* Report Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Reason for reporting
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs sm:text-sm font-medium border border-gray-300 rounded-xl px-3 py-2.5 bg-white text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Additional Details <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context (e.g. 'Application deadline closed on Friday' or 'Official link returns 404')..."
              rows={3}
              maxLength={2000}
              className="w-full text-xs sm:text-sm p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
