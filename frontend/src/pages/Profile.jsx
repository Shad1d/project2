import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import {
  User,
  Save,
  BookOpen,
  MapPin,
  Award,
  Compass,
  Camera,
  Trash2,
  Loader2,
  UploadCloud,
} from "lucide-react";
import LocationPickerMap from "../components/LocationPickerMap.jsx";

export default function Profile() {
  const { user, token, isLoggedIn, isHydrating, login } = useAuth();
  const navigate = useNavigate();

  const fileInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldsList, setFieldsList] = useState([]);
  const [skillsList, setSkillsList] = useState([]);

  // Form State
  const [displayName, setDisplayName] = useState("");
  const [educationLevel, setEducationLevel] = useState("UNDERGRADUATE");
  const [major, setMajor] = useState("");
  const [majorFieldId, setMajorFieldId] = useState("");
  const [university, setUniversity] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [locationCoords, setLocationCoords] = useState(null);
  const [experienceLevel, setExperienceLevel] = useState("ENTRY");
  const [remotePreference, setRemotePreference] = useState("ANY");
  const [selectedSkills, setSelectedSkills] = useState([]);

  // If not logged in, redirect to login only after auth state finishes hydrating
  useEffect(() => {
    if (!isHydrating && !isLoggedIn) {
      navigate("/login");
    }
  }, [isHydrating, isLoggedIn, navigate]);

  // Load fields & skills taxonomies
  useEffect(() => {
    api.get("/fields").then((res) => setFieldsList(res.data.data || []));
    api.get("/skills").then((res) => setSkillsList(res.data.data || []));
  }, []);

  // Populate form with current user profile
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      const p = user.profile || {};
      setEducationLevel(p.educationLevel || "UNDERGRADUATE");
      setMajor(p.major || "");
      setMajorFieldId(p.majorFieldId || "");
      setUniversity(p.university || "");
      setGraduationYear(p.graduationYear || "");
      setCountry(p.country || "");
      setAddress(p.address || "");
      if (Array.isArray(p.location?.coordinates) && p.location.coordinates.length === 2) {
        setLocationCoords({
          lat: p.location.coordinates[1],
          lng: p.location.coordinates[0],
        });
      } else {
        setLocationCoords(null);
      }
      setExperienceLevel(p.experienceLevel || "ENTRY");
      setRemotePreference(p.remotePreference || "ANY");
      setSelectedSkills(p.skillIds || []);
    }
  }, [user]);

  const handleSkillToggle = (skillId) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, WebP or GIF).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit. Please choose a smaller image.");
      return;
    }

    setAvatarUploading(true);
    const formData = new FormData();
    formData.append("picture", file);

    try {
      const res = await api.post("/auth/profile/picture", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      login(res.data.user, token);
      toast.success("Profile picture updated successfully!");
    } catch (err) {
      const message =
        err.response?.data?.error?.message ||
        "Failed to upload profile picture. Ensure Supabase credentials are configured.";
      toast.error(message);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAvatarRemove = async () => {
    if (!window.confirm("Are you sure you want to remove your profile picture?")) {
      return;
    }

    setAvatarUploading(true);
    try {
      const res = await api.delete("/auth/profile/picture");
      login(res.data.user, token);
      toast.success("Profile picture removed successfully!");
    } catch (err) {
      const message =
        err.response?.data?.error?.message || "Failed to remove profile picture.";
      toast.error(message);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        displayName,
        educationLevel,
        major,
        majorFieldId: majorFieldId || null,
        university,
        graduationYear: graduationYear ? parseInt(graduationYear, 10) : null,
        country: country ? country.toUpperCase() : null,
        address,
        location: locationCoords
          ? {
              type: "Point",
              coordinates: [locationCoords.lng, locationCoords.lat],
            }
          : null,
        experienceLevel,
        remotePreference,
        skillIds: selectedSkills,
      };

      const res = await api.put("/auth/profile", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update state with refreshed user data
      login(res.data.user, token);
      toast.success("Profile saved successfully!");
    } catch (err) {
      const message =
        err.response?.data?.error?.message || "Failed to update profile.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (isHydrating) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-400 animate-pulse">
        Loading profile...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-5 mb-6">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Profile</h1>
            <p className="text-sm text-gray-500">
              Customize your profile to unlock accurate, explainable opportunity matching
            </p>
          </div>
        </div>

        {/* Profile Picture Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-5 bg-slate-50 border border-slate-200/80 rounded-2xl mb-8">
          {/* Avatar Preview with Camera Overlay */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-md bg-white flex items-center justify-center">
              {user?.profile?.profilePicture ? (
                <img
                  src={user.profile.profilePicture}
                  alt={user.displayName || "Profile photo"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#0F8B8D]/10 text-[#0F8B8D] flex items-center justify-center text-3xl font-bold">
                  {displayName ? (
                    displayName.charAt(0).toUpperCase()
                  ) : (
                    <User className="w-10 h-10" />
                  )}
                </div>
              )}
            </div>

            {avatarUploading && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            )}

            {/* Quick Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              title="Change profile picture"
              className="absolute bottom-0 right-0 p-2 bg-[#0B1F3A] hover:bg-[#0F8B8D] text-white rounded-full shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Picture Actions and Guidance */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h3 className="text-base font-bold text-[#0B1F3A]">Profile Photo</h3>
              {user?.profile?.profilePicture && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Cloud Synced
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 mb-3">
              Upload a clear student portrait. Photos are securely stored in Supabase Storage and linked to your MongoDB account. (Max 5MB)
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
            />

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="px-3.5 py-1.5 bg-white border border-slate-300 hover:border-[#0F8B8D] text-slate-700 hover:text-[#0F8B8D] text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                {avatarUploading ? "Uploading..." : "Upload New Photo"}
              </button>

              {user?.profile?.profilePicture && (
                <button
                  type="button"
                  onClick={handleAvatarRemove}
                  disabled={avatarUploading}
                  className="px-3.5 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Photo
                </button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed outline-none"
              />
            </div>
          </div>

          {/* Education Details */}
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Academic Background
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Education Level
                </label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="HIGH_SCHOOL">High School</option>
                  <option value="UNDERGRADUATE">Undergraduate (Bachelor's)</option>
                  <option value="RECENT_GRADUATE">Recent Graduate</option>
                  <option value="MASTERS">Master's</option>
                  <option value="PHD">PhD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field of Study (Discipline)
                </label>
                <select
                  value={majorFieldId}
                  onChange={(e) => setMajorFieldId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">-- Select Field --</option>
                  {fieldsList.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  University / College Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stanford University"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Graduation Year
                </label>
                <input
                  type="number"
                  placeholder="2027"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Location & Work Preferences
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country Code (ISO-2)
                </label>
                <input
                  type="text"
                  maxLength={2}
                  placeholder="US, BD, DE, CA"
                  value={country}
                  onChange={(e) => setCountry(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remote Preference
                </label>
                <select
                  value={remotePreference}
                  onChange={(e) => setRemotePreference(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="ANY">Flexible / Any</option>
                  <option value="REMOTE">Remote Only</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONSITE">On-Site</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="NONE">No Prior Experience</option>
                  <option value="ENTRY">Entry (under 1 year)</option>
                  <option value="INTERMEDIATE">Intermediate (1-3 years)</option>
                  <option value="ADVANCED">Advanced (3+ years)</option>
                </select>
              </div>
            </div>

            {/* Interactive Leaflet Map Location Picker */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <LocationPickerMap
                coords={locationCoords}
                address={address}
                label="Home Base or Campus Location (For Radius Matching)"
                onChange={({ lat, lng, address: newAddr, countryCode }) => {
                  setLocationCoords({ lat, lng });
                  setAddress(newAddr);
                  if (countryCode && !country) setCountry(countryCode);
                }}
              />
            </div>
          </div>

          {/* Skills Selection */}
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              Technical & Core Skills ({selectedSkills.length} selected)
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Click skills to add or remove them from your profile
            </p>

            <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-3 border border-gray-200 rounded-xl bg-gray-50">
              {skillsList.map((skill) => {
                const isSelected = selectedSkills.includes(skill._id);
                return (
                  <button
                    key={skill._id}
                    type="button"
                    onClick={() => handleSkillToggle(skill._id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer border ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {skill.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors text-sm disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
