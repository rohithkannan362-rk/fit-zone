import React, { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { uploadUserAvatar, removeUserAvatar } from "../../utils/avatarUtils";
import BackButton from "../../components/ui/BackButton";
import StatusBadge from "../../components/ui/StatusBadge";
import { formatTimestamp } from "../../utils/dateUtils";
import {
  User,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  Camera,
  Trash2,
  Edit3,
  Save,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  IdCard,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminProfile() {
  const { user, syncProfileData } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(() => user?.member?.full_name || "");
  const [phone, setPhone] = useState(() => user?.member?.mobile || "");
  const [formErrors, setFormErrors] = useState<{ fullName?: string; phone?: string }>({});

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const validate = () => {
    const errors: { fullName?: string; phone?: string } = {};
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      errors.fullName = "Full name is required";
    } else if (trimmedName.length < 2) {
      errors.fullName = "Full name must be at least 2 characters";
    }

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      errors.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(trimmedPhone.replace(/[\s-]/g, ""))) {
      errors.phone = "Please enter a valid 10-digit phone number";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStartEdit = () => {
    setFullName(user?.member?.full_name || "");
    setPhone(user?.member?.mobile || "");
    setFormErrors({});
    setErrorMessage("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setFullName(user?.member?.full_name || "");
    setPhone(user?.member?.mobile || "");
    setFormErrors({});
    setErrorMessage("");
    setIsEditing(false);
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (isSaving) return;

    setIsSaving(true);
    setErrorMessage("");

    try {
      await syncProfileData({
        full_name: fullName.trim(),
        mobile: phone.trim(),
      });
      setSuccessMessage("Admin profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      setErrorMessage(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user?.uid) return;

    const file = files[0];
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setErrorMessage("Please select a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image size must be less than 5MB.");
      return;
    }

    setIsUploadingAvatar(true);
    setErrorMessage("");

    try {
      const { avatarUrl } = await uploadUserAvatar(file, user.uid);
      await syncProfileData({ avatar_url: avatarUrl });
      setSuccessMessage("Profile photo updated successfully!");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      setErrorMessage(err.message || "Failed to upload photo. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.uid || isUploadingAvatar) return;
    if (!window.confirm("Are you sure you want to remove your profile photo?")) return;

    setIsUploadingAvatar(true);
    setErrorMessage("");

    try {
      await removeUserAvatar(user.uid);
      await syncProfileData({ avatar_url: "" });
      setSuccessMessage("Profile photo removed.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error("Failed to remove avatar:", err);
      setErrorMessage(err.message || "Failed to remove photo.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const displayName = user?.member?.full_name || user?.email?.split("@")[0] || "Administrator";
  const displayEmail = user?.email || user?.member?.email || "";
  const displayPhone = user?.member?.mobile || "Not specified";
  const displayMemberCode = user?.member?.member_code || "ADMIN-01";
  const avatarUrl = user?.member?.avatar_url;

  return (
    <div className="min-h-screen bg-[#030303] text-white p-4 sm:p-6 md:p-12 overflow-x-hidden selection:bg-gym-red selection:text-white">
      <div className="max-w-4xl mx-auto">
        <BackButton to="/admin" label="BACK TO DASHBOARD" />

        {/* PAGE HEADER */}
        <div className="mb-8 md:mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">
              Admin <span className="text-gym-red">Profile</span>
            </h1>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
              Personal Administrator Account & Credentials
            </p>
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={handleStartEdit}
              data-testid="edit-profile-btn"
              className="inline-flex items-center justify-center gap-2 bg-gym-red hover:bg-white hover:text-black text-white px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-[0_0_20px_rgba(255,51,51,0.3)] cursor-pointer min-h-[44px]"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* ALERTS */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-xl text-sm mb-6"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </motion.div>
          )}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 bg-gym-red/10 border border-gym-red/30 text-gym-red p-4 rounded-xl text-sm mb-6"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="font-semibold">{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HERO PROFILE CARD */}
        <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-gym-red/40 via-white/10 to-transparent shadow-2xl mb-8">
          <div className="bg-gradient-to-br from-[#121212] via-[#090909] to-[#040404] backdrop-blur-2xl rounded-[15px] p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gym-red/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
              {/* AVATAR WITH PHOTO UPLOAD & REMOVE */}
              <div className="relative group shrink-0">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-[3px] bg-gradient-to-tr from-gym-red via-red-500 to-gym-orange shadow-[0_0_30px_rgba(255,51,51,0.35)]">
                  <div className="w-full h-full bg-[#0a0a0a] rounded-full flex items-center justify-center overflow-hidden relative">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-4xl font-black text-white/90">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    )}

                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload camera button */}
                <label
                  htmlFor="admin-avatar-upload"
                  title="Upload profile photo"
                  className="absolute bottom-0 right-0 w-10 h-10 bg-gym-red hover:bg-red-600 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-[0_0_15px_rgba(255,51,51,0.6)] border-2 border-[#090909] min-w-[40px] min-h-[40px]"
                >
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    id="admin-avatar-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                    disabled={isUploadingAvatar}
                    data-testid="avatar-file-input"
                  />
                </label>

                {/* Delete photo button */}
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={isUploadingAvatar}
                    className="absolute top-0 right-0 w-7 h-7 bg-black/80 hover:bg-gym-red text-white/70 hover:text-white rounded-full flex items-center justify-center transition-colors cursor-pointer border border-white/20"
                    title="Remove photo"
                    data-testid="remove-avatar-btn"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* IDENTITY INFO */}
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white" data-testid="admin-display-name">
                    {displayName}
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gym-red/20 text-gym-red border border-gym-red/40 shadow-[0_0_12px_rgba(255,51,51,0.3)]">
                    <Shield className="w-3 h-3" />
                    <span>ADMIN</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-400 border border-green-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span>ACTIVE</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-semibold text-white/60">
                  <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-lg border border-white/5 font-mono text-[11px] text-white/80">
                    <IdCard className="w-3.5 h-3.5 text-gym-red" />
                    <span>ID: {displayMemberCode}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-white/40" />
                    <span className="text-white/80" data-testid="admin-display-email">{displayEmail}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-white/40" />
                    <span className="text-white/80" data-testid="admin-display-phone">{displayPhone}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VIEW MODE vs EDIT MODE */}
        <AnimatePresence mode="wait">
          {!isEditing ? (
            /* ================= VIEW MODE ================= */
            <motion.div
              key="view-mode"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="bg-[#080808] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/50 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-gym-red" />
                    Account Overview & Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="bg-[#0e0e0e] border border-white/5 p-4 rounded-xl">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
                      Full Name
                    </p>
                    <p className="text-sm font-bold text-white" data-testid="view-fullname">
                      {displayName}
                    </p>
                  </div>

                  {/* Email */}
                  <div className="bg-[#0e0e0e] border border-white/5 p-4 rounded-xl relative">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                        Email Address
                      </p>
                      <span className="text-[9px] font-bold text-white/30 uppercase flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Read-only
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white" data-testid="view-email">
                      {displayEmail}
                    </p>
                  </div>

                  {/* Phone */}
                  <div className="bg-[#0e0e0e] border border-white/5 p-4 rounded-xl">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
                      Phone Number
                    </p>
                    <p className="text-sm font-bold text-white" data-testid="view-phone">
                      {displayPhone}
                    </p>
                  </div>

                  {/* Admin Code */}
                  <div className="bg-[#0e0e0e] border border-white/5 p-4 rounded-xl">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
                      Administrator Identifier
                    </p>
                    <p className="text-sm font-mono font-bold text-gym-red" data-testid="view-code">
                      {displayMemberCode}
                    </p>
                  </div>

                  {/* Role */}
                  <div className="bg-[#0e0e0e] border border-white/5 p-4 rounded-xl">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
                      System Role
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white uppercase">Administrator</span>
                      <span className="text-[9px] font-bold bg-white/10 px-2 py-0.5 rounded text-white/60">
                        Full Permissions
                      </span>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className="bg-[#0e0e0e] border border-white/5 p-4 rounded-xl">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
                      Account Status
                    </p>
                    <StatusBadge status="active" size="sm" />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-white/40">
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Member since: {formatTimestamp(user?.member?.created_at) || "Active"}</span>
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-white/30">
                    FitZone Gym Management System v2.0
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ================= EDIT MODE ================= */
            <motion.div
              key="edit-mode"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-[#080808] border border-white/10 rounded-2xl p-6 sm:p-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-gym-red" />
                    Edit Personal Information
                  </h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
                    Update your display name, contact number, and profile picture
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveChanges} className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60">
                    Full Name <span className="text-gym-red">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (formErrors.fullName) {
                          setFormErrors((prev) => ({ ...prev, fullName: undefined }));
                        }
                      }}
                      data-testid="edit-name-input"
                      placeholder="e.g. John Doe"
                      className={`w-full bg-[#111] border ${
                        formErrors.fullName ? "border-gym-red" : "border-white/10"
                      } rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gym-red transition-colors`}
                    />
                  </div>
                  {formErrors.fullName && (
                    <p className="text-xs text-gym-red font-semibold">{formErrors.fullName}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60">
                    Phone Number <span className="text-gym-red">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (formErrors.phone) {
                          setFormErrors((prev) => ({ ...prev, phone: undefined }));
                        }
                      }}
                      data-testid="edit-phone-input"
                      placeholder="e.g. 9876543210"
                      className={`w-full bg-[#111] border ${
                        formErrors.phone ? "border-gym-red" : "border-white/10"
                      } rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gym-red transition-colors`}
                    />
                  </div>
                  {formErrors.phone && (
                    <p className="text-xs text-gym-red font-semibold">{formErrors.phone}</p>
                  )}
                </div>

                {/* Email Address (Read-only) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60">
                      Email Address
                    </label>
                    <span className="text-[10px] text-white/40 flex items-center gap-1 font-semibold">
                      <Lock className="w-3 h-3 text-white/30" /> Read-only
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                    <input
                      type="email"
                      value={displayEmail}
                      disabled
                      data-testid="edit-email-input"
                      className="w-full bg-[#161616] border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white/40 cursor-not-allowed select-none"
                    />
                  </div>
                  <p className="text-[10px] text-white/30 tracking-wide">
                    Email address is managed by authentication and cannot be directly modified.
                  </p>
                </div>

                {/* Profile Photo Notice */}
                <div className="bg-[#111] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-white">Profile Photo</p>
                    <p className="text-[10px] text-white/40 mt-0.5">
                      Tap the camera icon above to upload a JPG, PNG, or WebP photo (max 5MB).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer shrink-0 min-h-[44px]"
                  >
                    {isUploadingAvatar ? "Uploading..." : "Select New Photo"}
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-white/5 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    data-testid="cancel-edit-btn"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-widest text-white/70 hover:text-white transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    data-testid="save-profile-btn"
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gym-red hover:bg-red-600 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,51,51,0.4)] cursor-pointer min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
