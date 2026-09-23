import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import "./index.css";

// Public
import LandingPage from "./pages/LandingPage";
import AuthCallback from "./pages/AuthCallback";

// Member
import MemberLogin from "./pages/member/MemberLogin";
import MemberRegister from "./pages/member/MemberRegister";
import ProfileCompletion from "./pages/member/ProfileCompletion";
import MemberDashboard from "./pages/member/MemberDashboard";
import PackageSelection from "./pages/member/PackageSelection";
import PaymentPage from "./pages/member/PaymentPage";
import PaymentSuccess from "./pages/member/PaymentSuccess";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminMemberProfile from "./pages/admin/AdminMemberProfile";
import AdminAddMember from "./pages/admin/AdminAddMember";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminPackages from "./pages/admin/AdminPackages";
import AdminReminders from "./pages/admin/AdminReminders";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ==================== PUBLIC ==================== */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* ==================== MEMBER AUTH ==================== */}
          <Route path="/member/login" element={<MemberLogin />} />
          <Route path="/member/register" element={<MemberRegister />} />
          <Route
            path="/member/complete-profile"
            element={<ProfileCompletion />}
          />

          {/* Legacy redirects */}
          <Route
            path="/login"
            element={<Navigate to="/member/login" replace />}
          />
          <Route
            path="/register"
            element={<Navigate to="/member/register" replace />}
          />
          <Route
            path="/dashboard"
            element={<Navigate to="/member/dashboard" replace />}
          />
          <Route
            path="/checkout"
            element={<Navigate to="/member/membership" replace />}
          />

          {/* ==================== MEMBER PORTAL ==================== */}
          <Route
            path="/member/dashboard"
            element={
              <ProtectedRoute allowedRoles={["member"]}>
                <MemberDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/membership"
            element={
              <ProtectedRoute allowedRoles={["member"]}>
                <PackageSelection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/payment"
            element={
              <ProtectedRoute allowedRoles={["member"]}>
                <PaymentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/payment/success"
            element={
              <ProtectedRoute allowedRoles={["member"]}>
                <PaymentSuccess />
              </ProtectedRoute>
            }
          />

          {/* ==================== ADMIN AUTH ==================== */}
          <Route path="/admin/login" element={<MemberLogin isAdmin />} />

          {/* ==================== ADMIN PORTAL ==================== */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/members"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminMembers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/members/new"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminAddMember />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/members/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminMemberProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminPayments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/packages"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminPackages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reminders"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminReminders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminSettings />
              </ProtectedRoute>
            }
          />

          {/* ==================== CATCH-ALL ==================== */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
