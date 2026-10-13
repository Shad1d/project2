import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api.js";
import { useAuth } from "./AuthContext.jsx";
import toast from "react-hot-toast";

const SavedContext = createContext(null);

export function SavedProvider({ children }) {
  const { token } = useAuth();
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch saved IDs whenever token changes
  const fetchSavedIds = useCallback(async () => {
    if (!token) {
      setSavedIds(new Set());
      return;
    }
    setLoading(true);
    try {
      const res = await api.get("/saved-opportunities/ids", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedIds(new Set(res.data.data || []));
    } catch (err) {
      console.error("Failed to load saved IDs:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSavedIds();
  }, [fetchSavedIds]);

  const isSaved = useCallback(
    (opportunityId) => {
      if (!opportunityId) return false;
      return savedIds.has(opportunityId.toString());
    },
    [savedIds]
  );

  const toggleSave = useCallback(
    async (opportunityId) => {
      if (!token) {
        toast.error("Please sign in to save opportunities.");
        return;
      }
      const oppIdStr = opportunityId.toString();
      const currentlySaved = savedIds.has(oppIdStr);

      // Optimistic state update
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (currentlySaved) {
          next.delete(oppIdStr);
        } else {
          next.add(oppIdStr);
        }
        return next;
      });

      try {
        if (currentlySaved) {
          await api.delete(`/saved-opportunities/${oppIdStr}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success("Removed from saved opportunities.");
        } else {
          await api.post(
            "/saved-opportunities",
            { opportunityId: oppIdStr },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          toast.success("Saved to your opportunities!");
        }
      } catch (err) {
        // Rollback state on error
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (currentlySaved) {
            next.add(oppIdStr);
          } else {
            next.delete(oppIdStr);
          }
          return next;
        });
        toast.error(err.response?.data?.error?.message || "Failed to update saved status.");
      }
    },
    [token, savedIds]
  );

  return (
    <SavedContext.Provider value={{ savedIds, isSaved, toggleSave, loading, refreshSavedIds: fetchSavedIds }}>
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() {
  const context = useContext(SavedContext);
  if (!context) {
    throw new Error("useSaved must be used within a SavedProvider");
  }
  return context;
}
