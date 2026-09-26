import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ArrowRight, User, Mail, Phone, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const ProfileCompletion = () => {
  const { user, syncProfileData } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(
    user?.member?.full_name && user.member.full_name !== "Unknown User"
      ? user.member.full_name
      : "",
  );
  const [email, setEmail] = useState(user?.email || user?.member?.email || "");
  const [mobile, setMobile] = useState(user?.member?.mobile || "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If they have all required fields, send them to dashboard
  useEffect(() => {
    if (
      user?.member?.full_name &&
      user?.member?.email &&
      user?.member?.mobile
    ) {
      navigate(user.role === "admin" ? "/admin" : "/member/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || name.trim().length < 2) {
      setError("Please enter your full name");
      return;
    }
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (!mobile || mobile.trim().length < 10) {
      setError("Please enter a valid mobile number");
      return;
    }

    setIsSubmitting(true);
    try {
      await syncProfileData({
        full_name: name.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
      });
      // the useEffect above will redirect them automatically when the context updates
    } catch (err: any) {
      console.error("Profile completion error:", err);
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gym-black flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gym-red rounded-full mix-blend-screen filter blur-[200px] opacity-10 pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card w-full max-w-md p-6 sm:p-10 relative z-10 border-t-4 border-t-gym-red"
      >
        <div className="flex flex-col items-center mb-6 sm:mb-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-white font-heading uppercase tracking-tighter">
            Complete <span className="text-gym-red">Profile</span>
          </h2>
          <p className="text-white/50 text-xs sm:text-sm mt-2 sm:mt-3 tracking-wider uppercase font-medium">
            We need a few more details to continue
          </p>
        </div>

        {error && (
          <div className="bg-gym-red/10 border border-gym-red/30 text-gym-red text-sm p-4 text-center font-bold tracking-wider uppercase mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
          {(!user?.member?.full_name ||
            user.member.full_name === "Unknown User") && (
            <div className="relative">
              <span className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-white/40">
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="FULL NAME"
                className="w-full bg-gym-charcoal border-2 border-white/10 py-3 sm:py-4 pl-11 sm:pl-14 pr-4 sm:pr-5 text-white font-bold tracking-widest text-sm sm:text-base focus:outline-none focus:border-gym-red transition-colors placeholder:text-white/20 uppercase"
              />
            </div>
          )}

          {!user?.email && !user?.member?.email && (
            <div className="relative">
              <span className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-white/40">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="EMAIL ADDRESS"
                className="w-full bg-gym-charcoal border-2 border-white/10 py-3 sm:py-4 pl-11 sm:pl-14 pr-4 sm:pr-5 text-white font-bold tracking-widest text-sm sm:text-base focus:outline-none focus:border-gym-red transition-colors placeholder:text-white/20 lowercase"
              />
            </div>
          )}

          {!user?.member?.mobile && (
            <div className="relative">
              <span className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-white/40">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="MOBILE NUMBER"
                className="w-full bg-gym-charcoal border-2 border-white/10 py-3 sm:py-4 pl-11 sm:pl-14 pr-4 sm:pr-5 text-white font-bold tracking-widest text-sm sm:text-base focus:outline-none focus:border-gym-red transition-colors placeholder:text-white/20 uppercase"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-3.5 sm:py-4 text-xs sm:text-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : null}
            {isSubmitting ? "Saving..." : "Complete Profile"}
            {!isSubmitting && <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ProfileCompletion;
