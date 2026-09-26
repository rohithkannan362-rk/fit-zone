import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const AuthCallback = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      // Check for error in URL parameters
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);
      
      const errorDescription = hashParams.get("error_description") || searchParams.get("error_description");
      if (errorDescription) {
        setError(errorDescription);
        return;
      }

      // If AuthContext has finished loading
      if (!isLoading) {
        if (user) {
          // Profile is resolved, redirect correctly according to role
          if (user.role === "admin") {
            navigate("/admin", { replace: true });
          } else {
            navigate("/member/dashboard", { replace: true });
          }
        } else {
          // Done loading but no user found
          setError("Authentication failed or session expired. Please try signing in again.");
        }
      }
    };

    handleAuth();
  }, [user, isLoading, navigate]);

  // Safety fallback: if auth takes longer than 12 seconds, display actionable message
  useEffect(() => {
    if (!isLoading || user || error) return;
    const timer = setTimeout(() => {
      if (isLoading && !user) {
        setError("Authentication took too long to resolve. Please return to login and try again.");
      }
    }, 12000);
    return () => clearTimeout(timer);
  }, [isLoading, user, error]);

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-6">
        <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center p-2 shadow-[0_0_30px_rgba(255,51,51,0.25)] border border-white/20 overflow-hidden">
          <img
            src="/logo.jpg"
            alt="FIT ZONE"
            className="w-full h-full object-contain rounded-full"
          />
        </div>
        
        {error ? (
          <div className="text-center max-w-sm">
            <div className="bg-gym-red/10 border border-gym-red/30 text-gym-red text-sm p-4 rounded-lg font-bold tracking-wider uppercase mb-6 flex flex-col items-center gap-2">
              <span>{error}</span>
              {error.includes("Admin Portal") && (
                <Link
                  to="/admin/login"
                  className="text-xs text-white underline hover:text-gym-red tracking-widest uppercase transition-colors"
                >
                  Go to Admin Login &rarr;
                </Link>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                to="/member/login"
                className="bg-gym-red hover:bg-white hover:text-black text-white px-5 py-2.5 rounded text-xs font-bold uppercase tracking-widest transition-all w-full sm:w-auto"
              >
                Back to Login
              </Link>
              <button
                onClick={() => navigate("/")}
                className="text-white/50 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors px-4 py-2.5 w-full sm:w-auto"
              >
                Return Home
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-gym-red animate-spin" />
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest">
              Authenticating...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
