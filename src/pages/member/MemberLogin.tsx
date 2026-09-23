import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowRight,
  Mail,
  Lock,
  ChevronLeft,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

interface MemberLoginProps {
  isAdmin?: boolean;
}

const MemberLogin = ({ isAdmin = false }: MemberLoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const { login, resetPassword, user, isLoading, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isLoading) {
      console.log(
        "MemberLogin: User found, checking profile completion...",
        user,
      );
      if (
        !user.member?.email ||
        !user.member?.mobile ||
        !user.member?.full_name
      ) {
        console.log(
          "MemberLogin: Profile incomplete, redirecting to complete-profile",
        );
        navigate("/member/complete-profile");
      } else if (user.role === "admin") {
        navigate("/admin");
      } else {
        console.log("MemberLogin: Profile complete, redirecting to dashboard");
        navigate("/member/dashboard");
      }
    }
  }, [user, isLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      console.error("Login error:", err);
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Invalid email or password. Please try again.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsSubmitting(true);
    console.log("Initiating Google OAuth login...");
    try {
      await loginWithGoogle();
      console.log("Google OAuth login initiated successfully.");
    } catch (err: any) {
      console.error("Google login error:", err);
      setError("Failed to login with Google.");
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address first");
      return;
    }

    try {
      await resetPassword(email.trim().toLowerCase());
      setResetSent(true);
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gym-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gym-red rounded-full mix-blend-screen filter blur-[200px] opacity-10 pointer-events-none"></div>

      <Link
        to="/"
        className="absolute top-8 left-8 text-white/50 hover:text-white flex items-center gap-2 transition-colors z-20"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="font-bold tracking-widest text-sm uppercase">
          Return
        </span>
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card w-full max-w-md p-10 relative z-10 border-t-4 border-t-gym-red"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="mb-6 bg-white p-3 rounded-lg shadow-2xl transform -rotate-2">
            <img
              src="/logo.jpg"
              alt="FIT ZONE"
              className="h-14 w-auto object-contain"
            />
          </div>
          <h2 className="text-3xl font-black text-white font-heading uppercase tracking-tighter">
            {isAdmin ? (
              <>
                Admin <span className="text-gym-red">Portal</span>
              </>
            ) : (
              <>
                Enter The <span className="text-gym-red">Zone</span>
              </>
            )}
          </h2>
          <p className="text-white/50 text-sm mt-3 tracking-wider uppercase font-medium">
            {isAdmin ? "Gym Owner Access Only" : "Member Login"}
          </p>
        </div>

        {error && (
          <div className="bg-gym-red/10 border border-gym-red/30 text-gym-red text-sm p-4 text-center font-bold tracking-wider uppercase mb-6">
            {error}
          </div>
        )}

        {resetSent && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-500 text-sm p-4 text-center font-bold tracking-wider uppercase mb-6">
            Password reset email sent! Check your inbox.
          </div>
        )}

        {showForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="flex flex-col gap-6">
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="EMAIL ADDRESS"
                className="w-full bg-gym-charcoal border-2 border-white/10 py-4 pl-14 pr-5 text-white font-bold tracking-widest focus:outline-none focus:border-gym-red transition-colors placeholder:text-white/20 lowercase"
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-3"
            >
              Send Reset Link <ArrowRight className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setResetSent(false);
                setError("");
              }}
              className="text-white/40 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors text-center"
            >
              Back to Login
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-5">
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="EMAIL ADDRESS"
                  className="w-full bg-gym-charcoal border-2 border-white/10 py-4 pl-14 pr-5 text-white font-bold tracking-widest focus:outline-none focus:border-gym-red transition-colors placeholder:text-white/20 lowercase"
                />
              </div>

              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="PASSWORD"
                  className="w-full bg-gym-charcoal border-2 border-white/10 py-4 pl-14 pr-14 text-white font-bold tracking-widest focus:outline-none focus:border-gym-red transition-colors placeholder:text-white/20 uppercase"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setError("");
                  }}
                  className="text-white/40 text-[10px] font-bold uppercase tracking-widest hover:text-gym-red transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : null}
                {isSubmitting ? "Signing In..." : "Sign In"}
                {!isSubmitting && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>

            {!isAdmin && (
              <>
                <div className="relative flex items-center py-4">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink-0 mx-4 text-white/40 text-xs font-bold tracking-widest uppercase">
                    OR
                  </span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className="w-full bg-white text-gym-black border-2 border-white py-4 font-black tracking-widest hover:bg-gray-200 hover:border-gray-200 transition-colors uppercase flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </button>
              </>
            )}

            {!isAdmin && (
              <div className="mt-4 text-center border-t border-white/10 pt-6">
                <p className="text-xs text-white/40 font-medium tracking-widest uppercase">
                  New to FIT ZONE?{" "}
                  <Link
                    to="/member/register"
                    className="text-white hover:text-gym-red transition-colors"
                  >
                    Create Account
                  </Link>
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MemberLogin;
