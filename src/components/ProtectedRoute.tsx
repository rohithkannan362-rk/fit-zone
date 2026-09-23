import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-2 rounded-sm shadow-[0_0_20px_rgba(255,51,51,0.2)]">
            <img
              src="/logo.jpg"
              alt="FIT ZONE"
              className="h-10 w-auto object-contain"
            />
          </div>
          <Loader2 className="w-6 h-6 text-gym-red animate-spin" />
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log(
      "ProtectedRoute: User is null and isLoading is false. Redirecting to login. Current path:",
      window.location.pathname,
      "Hash:",
      window.location.hash,
    );
    if (
      window.location.search.includes("code=") ||
      window.location.hash.includes("access_token=")
    ) {
      alert(
        "Authentication failed: user is null despite OAuth callback. Redirecting to login.",
      );
    }
    // Determine redirect based on the route context
    const isAdminRoute = window.location.pathname.startsWith("/admin");
    return (
      <Navigate to={isAdminRoute ? "/admin/login" : "/member/login"} replace />
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role mismatch — redirect to appropriate dashboard
    if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/member/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
