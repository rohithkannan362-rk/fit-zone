import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";
import BackButton from "../../components/ui/BackButton";
import { motion } from "framer-motion";
import {
  generateSecureTemporaryPassword,
  validatePasswordSecurity,
} from "../../utils/passwordUtils";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function AdminAddMember() {
  const navigate = useNavigate();

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [passwordMode, setPasswordMode] = useState<"generate" | "custom">("generate");
  const [password, setPassword] = useState(() => generateSecureTemporaryPassword(""));
  const [showPassword, setShowPassword] = useState(false);

  // UI interaction states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    mobile?: string;
    password?: string;
  }>({});

  // Created member confirmation state
  const [createdMember, setCreatedMember] = useState<{
    id: string;
    fullName: string;
    email: string;
    memberCode: string;
    tempPassword: string;
  } | null>(null);

  // Regenerate password
  const handleRegeneratePassword = () => {
    const newPass = generateSecureTemporaryPassword(fullName);
    setPassword(newPass);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  // Switch password mode
  const handleModeChange = (mode: "generate" | "custom") => {
    setPasswordMode(mode);
    setError(null);
    if (mode === "generate") {
      setPassword(generateSecureTemporaryPassword(fullName));
    } else {
      setPassword("");
    }
  };

  // Copy password to clipboard with fallback
  const handleCopyPassword = async (textToCopy: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Validation
  const validateForm = () => {
    const errors: {
      fullName?: string;
      email?: string;
      mobile?: string;
      password?: string;
    } = {};

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      errors.fullName = "Full name is required";
    } else if (trimmedName.length < 2) {
      errors.fullName = "Full name must be at least 2 characters";
    } else if (trimmedName.length > 100) {
      errors.fullName = "Full name cannot exceed 100 characters";
    }

    const trimmedMobile = mobile.trim().replace(/[\s-]/g, "");
    if (!trimmedMobile) {
      errors.mobile = "Mobile number is required";
    } else if (!/^[0-9]{10}$/.test(trimmedMobile)) {
      errors.mobile = "Please enter a valid 10-digit mobile number";
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = "Please enter a valid email address";
    }

    const pwdCheck = validatePasswordSecurity(password);
    if (!pwdCheck.isValid) {
      errors.password = pwdCheck.error;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (loading) return;

    setLoading(true);
    setError(null);

    const submittedPassword = password;

    try {
      // 1. Invoke the secure admin-create-member Edge Function
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        "admin-create-member",
        {
          body: {
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            mobile: mobile.trim(),
            password: submittedPassword,
          },
        }
      );

      if (!fnError && fnData?.success) {
        setCreatedMember({
          id: fnData.user.id,
          fullName: fnData.user.fullName || fullName.trim(),
          email: fnData.user.email || email.trim().toLowerCase(),
          memberCode: fnData.user.memberCode || "FZ-PENDING",
          tempPassword: submittedPassword,
        });
        return;
      }

      if (fnData?.error) {
        throw new Error(fnData.error);
      }
      if (fnError && !fnError.message?.includes("Failed to send a request")) {
        throw new Error(fnError.message);
      }

      // 2. Fallback to client client creation if function was offline
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });

      const { data, error: signUpError } = await tempClient.auth.signUp({
        email: email.trim().toLowerCase(),
        password: submittedPassword,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: mobile.trim(),
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("Failed to create member user");

      // Supabase returns empty identities array if email is already taken
      if (data.user.identities && data.user.identities.length === 0) {
        throw new Error("This email address is already in use by another member.");
      }

      // Fetch the generated member_code from the profiles table
      let assignedMemberCode = "";
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("member_code")
          .eq("id", data.user.id)
          .single();

        if (prof?.member_code) {
          assignedMemberCode = prof.member_code;
          break;
        }
        await new Promise((r) => setTimeout(r, 600));
      }

      // Show confirmation screen
      setCreatedMember({
        id: data.user.id,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        memberCode: assignedMemberCode || "FZ-PENDING",
        tempPassword: submittedPassword,
      });
    } catch (err: any) {
      console.error("Add member error:", err);
      setError(err.message || "An unexpected error occurred while creating member.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setFullName("");
    setEmail("");
    setMobile("");
    setPasswordMode("generate");
    setPassword(generateSecureTemporaryPassword(""));
    setShowPassword(false);
    setError(null);
    setFieldErrors({});
    setCreatedMember(null);
  };

  // ==========================================
  // CONFIRMATION SCREEN (AFTER SUCCESSFUL CREATION)
  // ==========================================
  if (createdMember) {
    return (
      <div className="min-h-screen bg-[#030303] text-white py-8 sm:py-12 px-4 sm:px-6 pb-24 md:pb-12 overflow-x-hidden selection:bg-gym-red selection:text-white">
        <div className="max-w-xl mx-auto">
          <BackButton to="/admin/members" label="BACK TO MEMBERS" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#080808] border border-green-500/30 p-6 sm:p-8 rounded-2xl shadow-[0_0_50px_rgba(34,197,94,0.15)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-[80px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
              <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                  MEMBER CREATED
                </h1>
                <p className="text-xs text-white/50 uppercase tracking-widest mt-0.5">
                  Account successfully created and active
                </p>
              </div>
            </div>

            {/* Summary Details */}
            <div className="space-y-4 mb-6">
              <div className="bg-[#111] border border-white/5 p-4 rounded-xl flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Full Name
                </span>
                <span className="text-sm font-bold text-white" data-testid="created-member-name">
                  {createdMember.fullName}
                </span>
              </div>

              <div className="bg-[#111] border border-white/5 p-4 rounded-xl flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Email Address
                </span>
                <span className="text-sm font-bold text-white font-mono" data-testid="created-member-email">
                  {createdMember.email}
                </span>
              </div>

              <div className="bg-[#111] border border-white/5 p-4 rounded-xl flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Member ID
                </span>
                <span className="text-sm font-black text-gym-red font-mono bg-gym-red/10 px-3 py-1 rounded-lg border border-gym-red/30" data-testid="created-member-id">
                  {createdMember.memberCode}
                </span>
              </div>

              {/* Temporary Password Box */}
              <div className="bg-gym-red/10 border border-gym-red/30 p-5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gym-red flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    Temporary Password
                  </span>
                  {copied && (
                    <span className="text-[10px] font-bold text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Password copied
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/60 border border-white/10 rounded-lg px-4 py-3 font-mono text-base font-bold text-white tracking-wider flex items-center justify-between">
                    <span data-testid="created-member-password">
                      {showPassword ? createdMember.tempPassword : "••••••••••••"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-white/40 hover:text-white transition-colors p-1"
                      title={showPassword ? "Hide password" : "Show password"}
                      data-testid="toggle-created-password"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyPassword(createdMember.tempPassword)}
                    data-testid="copy-created-password"
                    className="bg-white hover:bg-gym-red text-black hover:text-white px-4 py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 min-h-[44px] shrink-0"
                    title="Copy Password"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                <p className="text-[10px] text-white/60 leading-relaxed">
                  Share this temporary password securely with the member. For security, this temporary password will not be shown again.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(`/admin/members/${createdMember.id}`)}
                data-testid="view-member-btn"
                className="w-full bg-gym-red hover:bg-red-600 text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,51,51,0.4)] flex items-center justify-center gap-2 min-h-[44px]"
              >
                <span>View Member Profile</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleResetForm}
                data-testid="add-another-btn"
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all min-h-[44px]"
              >
                Register Another Member
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ADD MEMBER FORM (MAIN VIEW)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#030303] text-white py-8 sm:py-12 px-4 sm:px-6 pb-24 md:pb-12 overflow-x-hidden selection:bg-gym-red selection:text-white">
      <div className="max-w-xl mx-auto">
        <BackButton to="/admin/members" label="BACK TO MEMBERS" />

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter">
            ADD <span className="text-gym-red">MEMBER</span>
          </h1>
          <p className="text-white/50 text-xs sm:text-sm mt-1 uppercase tracking-widest">
            Register a new member profile
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#080808] border border-white/10 p-6 sm:p-8 rounded-2xl shadow-2xl relative"
        >
          {error && (
            <div
              className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs sm:text-sm mb-6 uppercase tracking-wider flex items-center gap-2.5"
              data-testid="form-error-banner"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-[10px] text-white/50 uppercase tracking-widest font-bold block">
                Full Name <span className="text-gym-red">*</span>
              </label>
              <div className="relative">
                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  type="text"
                  name="fullName"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fieldErrors.fullName) {
                      setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                    }
                  }}
                  data-testid="member-name-input"
                  placeholder="e.g. Rohith Kannan"
                  className={`w-full bg-white/5 border ${
                    fieldErrors.fullName ? "border-gym-red" : "border-white/10"
                  } rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-gym-red transition-colors text-sm min-h-[44px]`}
                />
              </div>
              {fieldErrors.fullName && (
                <p className="text-xs text-gym-red font-semibold">{fieldErrors.fullName}</p>
              )}
            </div>

            {/* Mobile Number */}
            <div className="space-y-2">
              <label className="text-[10px] text-white/50 uppercase tracking-widest font-bold block">
                Mobile Number <span className="text-gym-red">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  type="tel"
                  name="mobile"
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value);
                    if (fieldErrors.mobile) {
                      setFieldErrors((prev) => ({ ...prev, mobile: undefined }));
                    }
                  }}
                  data-testid="member-phone-input"
                  placeholder="e.g. 9876543210"
                  className={`w-full bg-white/5 border ${
                    fieldErrors.mobile ? "border-gym-red" : "border-white/10"
                  } rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-gym-red transition-colors text-sm min-h-[44px]`}
                />
              </div>
              {fieldErrors.mobile && (
                <p className="text-xs text-gym-red font-semibold">{fieldErrors.mobile}</p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <label className="text-[10px] text-white/50 uppercase tracking-widest font-bold block">
                Email Address <span className="text-gym-red">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                  data-testid="member-email-input"
                  placeholder="e.g. rohith@example.com"
                  className={`w-full bg-white/5 border ${
                    fieldErrors.email ? "border-gym-red" : "border-white/10"
                  } rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-gym-red transition-colors text-sm min-h-[44px]`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-gym-red font-semibold">{fieldErrors.email}</p>
              )}
            </div>

            {/* PASSWORD SECTION */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-white/50 uppercase tracking-widest font-bold block">
                  Temporary Password <span className="text-gym-red">*</span>
                </label>
                {/* Switch between Auto Generate & Custom */}
                <div className="flex items-center bg-white/5 p-1 rounded-lg border border-white/10 text-[10px] font-bold uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => handleModeChange("generate")}
                    data-testid="mode-generate-btn"
                    className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                      passwordMode === "generate"
                        ? "bg-gym-red text-white shadow"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    Auto Generate
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange("custom")}
                    data-testid="mode-custom-btn"
                    className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                      passwordMode === "custom"
                        ? "bg-gym-red text-white shadow"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {/* Password Box */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  readOnly={passwordMode === "generate"}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  data-testid="member-password-input"
                  placeholder={passwordMode === "custom" ? "Enter custom temporary password" : "Auto-generated"}
                  className={`w-full ${
                    passwordMode === "generate" ? "bg-black/60 font-mono" : "bg-white/5"
                  } border ${
                    fieldErrors.password ? "border-gym-red" : "border-white/10"
                  } rounded-xl py-3.5 pl-12 pr-28 text-white placeholder:text-white/20 focus:outline-none focus:border-gym-red transition-colors text-sm min-h-[44px]`}
                />

                {/* Password Controls (Right Side) */}
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {/* Regenerate Button (in generate mode) */}
                  {passwordMode === "generate" && (
                    <button
                      type="button"
                      onClick={handleRegeneratePassword}
                      data-testid="regenerate-password-btn"
                      className="p-2 text-white/40 hover:text-gym-red transition-colors cursor-pointer rounded-lg hover:bg-white/5"
                      title="Regenerate Password"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={() => handleCopyPassword(password)}
                    data-testid="copy-password-btn"
                    className="p-2 text-white/40 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/5"
                    title="Copy Password"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>

                  {/* Show/Hide Button */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="toggle-password-btn"
                    className="p-2 text-white/40 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/5"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Copy feedback */}
              {copied && (
                <p className="text-[10px] text-green-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Check className="w-3 h-3" /> Password copied to clipboard
                </p>
              )}

              {fieldErrors.password && (
                <p className="text-xs text-gym-red font-semibold">{fieldErrors.password}</p>
              )}

              <p className="text-[10px] text-white/40 uppercase tracking-widest">
                {passwordMode === "generate"
                  ? "A secure temporary password incorporating the member's name and random characters has been created."
                  : "Enter a secure temporary password (at least 8 characters)."}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              data-testid="submit-create-member"
              className="w-full bg-gym-red hover:bg-white hover:text-black text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all mt-8 shadow-[0_0_20px_rgba(255,51,51,0.3)] disabled:opacity-50 flex justify-center items-center gap-2 min-h-[44px] cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Member...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Member</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
