import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAllMembers } from "../../services/memberService";
import { getAllMemberships } from "../../services/membershipService";
import { getAllPayments, getTotalRevenue } from "../../services/paymentService";
import {
  type Profile,
  type Membership,
  type Payment,
} from "../../lib/supabase-types";
import {
  formatCurrencyShort,
  getMembershipStatus,
} from "../../utils/dateUtils";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import {
  LogOut,
  Users,
  IndianRupee,
  LayoutDashboard,
  Search,
  Plus,
  Activity,
  Bell,
  ArrowUpRight,
  Package,
  FileText,
  Settings,
  AlertTriangle,
  Clock,
  PauseCircle,
  User,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [members, setMembers] = useState<Profile[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Determine active tab from URL
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/admin/members")) return "members";
    if (path.includes("/admin/payments")) return "payments";
    if (path.includes("/admin/packages")) return "packages";
    if (path.includes("/admin/reminders")) return "reminders";
    if (path.includes("/admin/reports")) return "reports";
    if (path.includes("/admin/settings")) return "settings";
    return "dashboard";
  };

  const activeTab = getActiveTab();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [m, ms, p, rev] = await Promise.all([
        getAllMembers(),
        getAllMemberships(),
        getAllPayments(),
        getTotalRevenue(),
      ]);
      setMembers(m);
      setMemberships(ms);
      setPayments(p);
      setTotalRevenue(rev);
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const totalMembers = members.length;
  const activeMembers = memberships.filter((m) => m.status === "active").length;
  const dueSoonCount = memberships.filter((m) => {
    const status = getMembershipStatus(
      new Date(m.end_date),
      new Date(m.next_due_date),
    );
    return status === "due_soon";
  }).length;
  const overdueCount = memberships.filter((m) => {
    const status = getMembershipStatus(
      new Date(m.end_date),
      new Date(m.next_due_date),
    );
    return status === "overdue";
  }).length;
  const dueTodayCount = memberships.filter((m) => {
    const status = getMembershipStatus(
      new Date(m.end_date),
      new Date(m.next_due_date),
    );
    return status === "due_today";
  }).length;
  const pausedCount = memberships.filter(
    (m) => m.reminder_status === "paused",
  ).length;

  const stats = [
    {
      label: "Total Members",
      value: String(totalMembers),
      icon: <Users className="w-5 h-5 text-gym-red" />,
      sub: `Active: ${activeMembers}`,
    },
    {
      label: "Active",
      value: String(activeMembers),
      icon: <Activity className="w-5 h-5 text-green-500" />,
      sub: `of ${totalMembers}`,
    },
    {
      label: "Due Soon",
      value: String(dueSoonCount),
      icon: <Clock className="w-5 h-5 text-yellow-500" />,
      sub: `Today: ${dueTodayCount}`,
    },
    {
      label: "Overdue",
      value: String(overdueCount),
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
      sub: "Needs attention",
    },
    {
      label: "Revenue",
      value: formatCurrencyShort(totalRevenue),
      icon: <IndianRupee className="w-5 h-5 text-gym-red" />,
      sub: "Total collected",
    },
    {
      label: "Paused",
      value: String(pausedCount),
      icon: <PauseCircle className="w-5 h-5 text-blue-500" />,
      sub: "Reminders held",
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      navigate("/admin/login");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const navItems = [
    {
      id: "dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/admin",
    },
    { id: "members", icon: Users, label: "Members", path: "/admin/members" },
    {
      id: "payments",
      icon: IndianRupee,
      label: "Payments",
      path: "/admin/payments",
    },
    {
      id: "packages",
      icon: Package,
      label: "Packages",
      path: "/admin/packages",
    },
    {
      id: "reminders",
      icon: Bell,
      label: "Reminders",
      path: "/admin/reminders",
    },
    { id: "reports", icon: FileText, label: "Reports", path: "/admin/reports" },
    {
      id: "profile",
      icon: User,
      label: "My Profile",
      path: "/admin/profile",
    },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
      path: "/admin/settings",
    },
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-white flex flex-col md:flex-row overflow-hidden selection:bg-gym-red selection:text-white font-sans relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gym-red/5 rounded-full mix-blend-screen filter blur-[150px] opacity-50"></div>
      </div>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="hidden md:flex w-72 bg-[#080808]/80 backdrop-blur-2xl border-r border-white/5 flex-col relative z-20 shadow-2xl"
      >
        <div className="p-8 border-b border-white/5 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gym-red/10 blur-3xl rounded-full"></div>
          <div className="bg-white w-10 h-10 rounded-full flex items-center justify-center p-1 shadow-[0_0_15px_rgba(255,51,51,0.25)] border border-white/20 overflow-hidden flex-shrink-0">
            <img
              src="/logo.jpg"
              alt="FIT ZONE"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div>
            <span className="font-black text-sm tracking-widest uppercase block leading-none">
              Admin<span className="text-gym-red">Zone</span>
            </span>
            <span className="text-white/40 text-[8px] font-bold uppercase tracking-[0.2em] mt-1 block">
              Command Center
            </span>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-300 font-bold uppercase tracking-widest text-[10px] rounded-lg relative overflow-hidden group ${
                activeTab === item.id
                  ? "text-white bg-white/5 border border-white/10"
                  : "text-white/40 hover:bg-white/[0.02] hover:text-white"
              }`}
            >
              {activeTab === item.id && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-gradient-to-r from-gym-red/20 to-transparent opacity-50 z-0"
                />
              )}
              {activeTab === item.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gym-red shadow-[0_0_10px_rgba(255,51,51,0.8)] z-10" />
              )}
              <item.icon
                className={`w-5 h-5 relative z-10 transition-colors ${activeTab === item.id ? "text-gym-red" : "group-hover:text-white"}`}
              />
              <span className="relative z-10">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 bg-gradient-to-t from-black/40 to-transparent">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-6 py-4 bg-[#0a0a0a] border border-white/5 hover:border-gym-red/50 text-white/50 hover:text-gym-red transition-all duration-300 font-bold uppercase tracking-widest text-[10px] rounded-lg group shadow-lg"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </div>
            <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
          </button>
        </div>
      </motion.aside>

      {/* Mobile Top Header */}
      <header className="md:hidden bg-[#080808]/90 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white w-8 h-8 rounded-full flex items-center justify-center p-1 shadow-[0_0_15px_rgba(255,51,51,0.25)] border border-white/20 overflow-hidden shrink-0">
            <img
              src="/logo.jpg"
              alt="FIT ZONE"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <span className="font-black text-sm tracking-widest uppercase block leading-none">
            Admin<span className="text-gym-red">Zone</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/profile"
            className="w-8 h-8 rounded-full bg-gym-red/20 border border-gym-red/40 flex items-center justify-center overflow-hidden shrink-0"
            title="Profile"
          >
            {user?.member?.avatar_url ? (
              <img
                src={user.member.avatar_url}
                alt="Admin"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 text-gym-red" />
            )}
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-x-0 top-[57px] bg-[#0a0a0a]/95 backdrop-blur-2xl border-b border-white/10 z-50 p-6 shadow-2xl flex flex-col gap-2 max-h-[calc(100vh-60px)] overflow-y-auto"
          >
            <div className="grid grid-cols-2 gap-2 mb-4">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3.5 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    activeTab === item.id
                      ? "bg-gym-red text-white shadow-lg"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
              <Link
                to="/admin/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5"
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </Link>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 border border-red-500/20 text-red-400 font-bold uppercase tracking-widest text-[10px] rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto relative z-10 p-4 sm:p-6 md:p-12 pb-24 md:pb-12 scroll-smooth">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <LoadingSpinner message="Loading admin data..." />
          ) : activeTab === "dashboard" ? (
            <AnimatePresence mode="wait">
              <motion.div
                key="dashboard"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  variants={itemVariants}
                  className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
                >
                  <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2">
                      FIT ZONE <span className="text-gym-red">ADMIN</span>
                    </h1>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse"></span>
                      System Online
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      to="/admin/profile"
                      data-testid="admin-profile-header-link"
                      className="bg-[#0a0a0a] hover:bg-[#141414] border border-white/10 hover:border-gym-red/40 px-3 py-2 rounded-xl flex items-center gap-3 shadow-2xl transition-all group min-h-[44px]"
                      title="View Administrator Profile"
                    >
                      <div className="w-8 h-8 rounded-full bg-gym-red/20 border border-gym-red/40 flex items-center justify-center overflow-hidden shrink-0">
                        {user?.member?.avatar_url ? (
                          <img
                            src={user.member.avatar_url}
                            alt="Admin"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 text-gym-red" />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-white group-hover:text-gym-red transition-colors">
                          {user?.member?.full_name || "Admin"}
                        </p>
                        <p className="text-[9px] text-white/40 font-mono font-bold uppercase tracking-wider">
                          {user?.member?.member_code || "ADMIN"}
                        </p>
                      </div>
                    </Link>

                    <div className="bg-[#0a0a0a] border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3 shadow-2xl min-h-[44px]">
                      <div className="text-right">
                        <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">
                          Today
                        </p>
                        <p className="text-xs font-bold uppercase tracking-wider">
                          {new Date().toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Stats Grid */}
                <motion.div
                  variants={containerVariants}
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12"
                >
                  {stats.map((stat, i) => (
                    <motion.div
                      key={i}
                      variants={itemVariants}
                      className="group relative"
                    >
                      <div className="relative bg-gradient-to-b from-white/[0.08] to-transparent rounded-2xl p-[1px] transition-all duration-500 group-hover:from-gym-red/50">
                        <div className="bg-[#080808] rounded-[15px] p-5 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-20 h-20 bg-gym-red/5 blur-2xl rounded-full transition-all duration-500 group-hover:bg-gym-red/20"></div>
                          <div className="mb-3 relative z-10">{stat.icon}</div>
                          <h3 className="text-2xl font-black mb-1 tracking-tight text-white/90 relative z-10">
                            {stat.value}
                          </h3>
                          <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest relative z-10">
                            {stat.label}
                          </p>
                          <p className="text-[8px] font-bold tracking-widest uppercase text-white/20 mt-2 relative z-10">
                            {stat.sub}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                  variants={itemVariants}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12"
                >
                  <Link
                    to="/admin/members"
                    className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl group"
                  >
                    <div className="bg-[#080808] rounded-[15px] p-5 sm:p-8 flex items-center gap-4 sm:gap-6 hover:bg-[#0a0a0a] transition-colors h-full">
                      <div className="p-3 sm:p-4 bg-white/5 rounded-xl group-hover:bg-gym-red/10 transition-colors">
                        <Search className="w-5 h-5 sm:w-6 sm:h-6 text-white/50 group-hover:text-gym-red transition-colors" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm uppercase tracking-widest mb-1">
                          Search Members
                        </h3>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">
                          Find by name, phone, code
                        </p>
                      </div>
                    </div>
                  </Link>

                  <button
                    onClick={() => navigate("/admin/members/new")}
                    className="bg-gradient-to-br from-gym-red/20 via-[#080808] to-[#080808] p-[1px] rounded-2xl group text-left"
                  >
                    <div className="bg-[#080808]/90 rounded-[15px] p-5 sm:p-8 flex items-center gap-4 sm:gap-6 h-full">
                      <div className="p-3 sm:p-4 bg-gym-red/10 rounded-xl">
                        <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-gym-red" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm uppercase tracking-widest mb-1">
                          Add Member
                        </h3>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">
                          Register new member
                        </p>
                      </div>
                    </div>
                  </button>

                  <Link
                    to="/admin/reports"
                    className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl group"
                  >
                    <div className="bg-[#080808] rounded-[15px] p-5 sm:p-8 flex items-center gap-4 sm:gap-6 hover:bg-[#0a0a0a] transition-colors h-full">
                      <div className="p-3 sm:p-4 bg-white/5 rounded-xl group-hover:bg-gym-red/10 transition-colors">
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white/50 group-hover:text-gym-red transition-colors" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm uppercase tracking-widest mb-1">
                          Export PDF
                        </h3>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">
                          Generate reports
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>

                {/* Recent Payments */}
                <motion.div variants={itemVariants}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black uppercase tracking-widest">
                      Recent Payments
                    </h3>
                    <Link
                      to="/admin/payments"
                      className="text-[10px] text-gym-red hover:text-white font-bold uppercase tracking-widest transition-colors flex items-center gap-1"
                    >
                      View All <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl">
                    <div className="bg-[#080808] rounded-[15px] overflow-hidden shadow-2xl">
                      {payments.slice(0, 5).map((payment, i) => (
                        <div
                          key={payment.id || i}
                          className="p-5 flex items-center justify-between border-b border-white/5 last:border-0 hover:bg-[#111] transition-colors"
                        >
                          <div>
                            <p className="text-xs font-bold tracking-wider mb-1">
                              {payment.package_name}
                            </p>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                              {payment.method}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-lg text-white/90">
                              ₹{payment.amount.toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>
                      ))}
                      {payments.length === 0 && (
                        <div className="p-12 text-center text-white/40 text-xs font-bold uppercase tracking-widest">
                          No payments recorded yet
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          ) : null}
        </div>
      </main>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#080808]/95 backdrop-blur-2xl border-t border-white/10 z-40 flex items-center justify-around py-2 px-2 shadow-2xl">
        <Link
          to="/admin"
          className={`flex flex-col items-center gap-1 py-1 px-3 text-[9px] font-bold uppercase tracking-wider ${
            activeTab === "dashboard" ? "text-gym-red" : "text-white/40"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Home</span>
        </Link>
        <Link
          to="/admin/members"
          className={`flex flex-col items-center gap-1 py-1 px-3 text-[9px] font-bold uppercase tracking-wider ${
            activeTab === "members" ? "text-gym-red" : "text-white/40"
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Members</span>
        </Link>
        <Link
          to="/admin/payments"
          className={`flex flex-col items-center gap-1 py-1 px-3 text-[9px] font-bold uppercase tracking-wider ${
            activeTab === "payments" ? "text-gym-red" : "text-white/40"
          }`}
        >
          <IndianRupee className="w-5 h-5" />
          <span>Payments</span>
        </Link>
        <Link
          to="/admin/packages"
          className={`flex flex-col items-center gap-1 py-1 px-3 text-[9px] font-bold uppercase tracking-wider ${
            activeTab === "packages" ? "text-gym-red" : "text-white/40"
          }`}
        >
          <Package className="w-5 h-5" />
          <span>Plans</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`flex flex-col items-center gap-1 py-1 px-3 text-[9px] font-bold uppercase tracking-wider ${
            mobileMenuOpen ? "text-gym-red" : "text-white/40"
          }`}
        >
          <Menu className="w-5 h-5" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
};

export default AdminDashboard;
