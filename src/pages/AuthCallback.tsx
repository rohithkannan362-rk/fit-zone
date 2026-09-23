import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
          // Profile is resolved, redirect correctly
          if (user.role === "admin") {
            navigate("/admin", { replace: true });
          } else {
            navigate("/member/dashboard", { replace: true });
          }
        } else {
          // Done loading but no user found
          setError("Authentication failed or session expired.");
        }
      }
    };

    handleAuth();
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-6">
        <div className="bg-white p-3 rounded-xl shadow-[0_0_30px_rgba(255,51,51,0.15)]">
          <img
            src="/logo.jpg"
            alt="FIT ZONE"
            className="h-12 w-auto object-contain"
          />
        </div>
        
        {error ? (
          <div className="text-center max-w-sm">
            <div className="bg-gym-red/10 border border-gym-red/30 text-gym-red text-sm p-4 rounded-lg font-bold tracking-wider uppercase mb-6">
              {error}
            </div>
            <button
              onClick={() => navigate("/")}
              className="text-white/50 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Return Home
            </button>
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
