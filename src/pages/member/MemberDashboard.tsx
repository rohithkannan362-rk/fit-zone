import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCurrentMembership, getUpcomingMembership } from "../../services/membershipService";
import { getMemberPayments } from "../../services/paymentService";
import { type Membership, type Payment } from "../../lib/supabase-types";
import {
  formatTimestamp,
  formatCurrency,
  getDaysRelativeToDue,
} from "../../utils/dateUtils";
import StatusBadge from "../../components/ui/StatusBadge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import {
  LogOut,
  CreditCard,
  FileText,
  ChevronRight,
  User,
  Home,
  IdCard,
  IndianRupee,
  Menu,
  ArrowRight,
  Shield,
  HelpCircle,
  Info,
  Settings,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MemberDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [membership, setMembership] = useState<Membership | null>(null);
  const [upcomingMembership, setUpcomingMembership] = useState<Membership | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.uid) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setError(null);
      const [m, u, p] = await Promise.all([
        getCurrentMembership(user!.uid),
        getUpcomingMembership(user!.uid),
        getMemberPayments(user!.uid),
      ]);
      setMembership(m);
      setUpcomingMembership(u);
      setPayments(p);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const memberName = user?.member?.full_name || user?.email || "Member";
  const memberCode = user?.member?.member_code || "";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const renderMembershipCard = (mem: Membership, title: string, isUpcoming = false) => {
    const dRel = getDaysRelativeToDue(new Date(mem.next_due_date));
    return (
      <motion.div variants={itemVariants} className="group relative mb-6">
        <div className={`bg-gradient-to-br ${isUpcoming ? 'from-blue-500/30' : 'from-gym-red/30'} to-transparent rounded-2xl p-[1px] transition-all duration-500 hover:from-${isUpcoming ? 'blue-500' : 'gym-red'}`}>
          <div className="bg-[#080808]/90 backdrop-blur-2xl border-none rounded-[15px] p-8 w-full relative overflow-hidden flex flex-col justify-between">
            <div className={`absolute top-0 right-0 w-48 h-48 ${isUpcoming ? 'bg-blue-500/10' : 'bg-gym-red/10'} blur-[50px] rounded-full group-hover:bg-${isUpcoming ? 'blue-500/20' : 'gym-red/20'} transition-colors duration-500`}></div>

            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <h3 className={`text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-1 flex items-center gap-2`}>
                  {title} {isUpcoming && <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-[8px]">FUTURE</span>}
                </h3>
                <p className="text-xl font-black">
                  {mem.package_name}
                </p>
                <p className="text-white/60 text-xs font-bold tracking-widest mt-1">
                  {formatCurrency(mem.amount)}
                </p>
              </div>
              <StatusBadge status={mem.status} size="md" />
            </div>

            <div className="mb-6 relative z-10">
              <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-1">
                {isUpcoming ? 'Starts on' : 'Valid until'}
              </p>
              <p className="text-2xl font-black text-white/90">
                {formatTimestamp(isUpcoming ? mem.start_date : mem.end_date)}
              </p>
            </div>

            <div className="border-t border-white/10 pt-5 relative z-10 flex justify-between items-center">
              <div>
                <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-1">
                  {isUpcoming ? 'Ends on' : 'Next Due'}
                </p>
                <p className={`font-black text-lg uppercase tracking-wider ${isUpcoming ? 'text-white' : 'text-gym-red'}`}>
                  {formatTimestamp(isUpcoming ? mem.end_date : mem.next_due_date)}
                </p>
              </div>
              {!isUpcoming && dRel > 0 && (
                <span className="text-white/30 text-xs font-bold">
                  {dRel} days left
                </span>
              )}
              {!isUpcoming && dRel < 0 && (
                <span className="text-red-500 text-xs font-bold">
                  {Math.abs(dRel)} days overdue
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading)
    return <LoadingSpinner fullScreen message="Loading dashboard..." />;

  if (error) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <Shield className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight mb-2">
          Oops! Something went wrong
        </h2>
        <p className="text-white/60 mb-8 max-w-md">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            loadData();
          }}
          className="bg-gym-red hover:bg-red-600 text-white px-8 py-3 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white relative selection:bg-gym-red selection:text-white pb-20 md:pb-0 md:pl-28 font-sans">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gym-red/10 rounded-full mix-blend-screen filter blur-[200px] opacity-40"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 w-full md:w-28 md:h-screen md:top-0 bg-[#080808]/90 backdrop-blur-2xl border-t md:border-t-0 md:border-r border-white/5 z-50 flex md:flex-col items-center justify-around md:justify-start md:pt-10 md:gap-8 px-2 py-4 md:p-0 shadow-2xl">
        <div className="hidden md:flex bg-white p-2 rounded-lg shadow-[0_0_20px_rgba(255,51,51,0.2)] mb-8">
          <img
            src="/logo.jpg"
            alt="FIT ZONE"
            className="h-8 w-auto object-contain"
          />
        </div>
        {[
          { id: "home", icon: Home, label: "Home" },
          { id: "membership", icon: IdCard, label: "Plan" },
          { id: "fees", icon: IndianRupee, label: "Fees" },
          { id: "more", icon: Menu, label: "More" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-2 group transition-all duration-300 flex-1 md:flex-none relative ${
              activeTab === tab.id
                ? "text-gym-red"
                : "text-white/40 hover:text-white"
            }`}
          >
            {activeTab === tab.id && (
              <div className="absolute top-[-16px] w-8 h-1 bg-gym-red rounded-b-full md:hidden shadow-[0_0_10px_rgba(255,51,51,0.8)]" />
            )}
            <tab.icon
              className={`w-6 h-6 md:w-7 md:h-7 transition-all duration-300 relative z-10 ${activeTab === tab.id ? "scale-110 drop-shadow-[0_0_10px_rgba(255,51,51,0.5)]" : "group-hover:scale-110"}`}
            />
            <span className="text-[9px] font-bold uppercase tracking-widest relative z-10">
              {tab.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Mobile Header */}
      <header className="md:hidden bg-[#080808]/90 backdrop-blur-md border-b border-white/5 sticky top-0 z-40">
        <div className="px-6 py-4 flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-md shadow-lg">
            <img
              src="/logo.jpg"
              alt="FIT ZONE"
              className="h-5 w-auto object-contain"
            />
          </div>
          <span className="font-black text-sm tracking-widest uppercase block leading-none">
            Member<span className="text-gym-red">Zone</span>
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 pt-10 pb-12 relative z-10 min-h-[80vh]">
        <AnimatePresence mode="wait">
          {/* HOME TAB */}
          {activeTab === "home" && (
            <motion.div
              key="home"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            >
              <motion.div variants={itemVariants} className="mb-10">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                  Hello, {memberName} 👋
                </p>
                <h1 className="text-4xl font-black uppercase tracking-tighter">
                  Welcome to <span className="text-gym-red">FIT ZONE</span>
                </h1>
                {memberCode && (
                  <p className="text-white/30 text-[10px] font-mono tracking-widest mt-2">
                    {memberCode}
                  </p>
                )}
              </motion.div>

              {/* Current Membership Card */}
              {membership ? (
                renderMembershipCard(membership, "Current Membership")
              ) : (
                <motion.div
                  variants={itemVariants}
                  className="glass-card p-8 text-center mb-6"
                >
                  <p className="text-white/50 text-sm font-bold uppercase tracking-widest mb-4">
                    No active membership
                  </p>
                  <button
                    onClick={() => navigate("/member/membership")}
                    className="bg-gym-red hover:bg-red-600 text-white px-8 py-3 text-xs font-bold uppercase tracking-widest transition-colors inline-flex items-center gap-2"
                  >
                    Choose a Plan <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {/* Upcoming Membership Card */}
              {upcomingMembership && renderMembershipCard(upcomingMembership, "Upcoming Membership", true)}

              <motion.button
                variants={itemVariants}
                onClick={() => navigate("/member/membership")}
                className="w-full bg-gym-red hover:bg-white hover:text-black text-white font-black text-sm uppercase tracking-widest py-5 rounded-xl shadow-[0_0_30px_rgba(255,51,51,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all duration-300 flex justify-center items-center gap-2 mb-12 group"
              >
                PAY MEMBERSHIP{" "}
                <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </motion.button>

              <motion.div variants={containerVariants} className="space-y-3">
                {[
                  { id: "fees", icon: CreditCard, label: "Payment History" },
                  { id: "receipts", icon: FileText, label: "Receipts" },
                ].map((link, i) => (
                  <motion.button
                    key={i}
                    variants={itemVariants}
                    onClick={() => setActiveTab(link.id)}
                    className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-[#0a0a0a] to-[#080808] hover:from-[#111] hover:to-[#0a0a0a] border border-white/5 hover:border-gym-red/30 rounded-xl transition-all duration-300 group shadow-lg"
                  >
                    <div className="flex items-center gap-5">
                      <div className="p-2 bg-white/5 rounded-lg group-hover:bg-gym-red/10 transition-colors">
                        <link.icon className="w-5 h-5 text-white/50 group-hover:text-gym-red transition-colors" />
                      </div>
                      <span className="font-bold text-xs tracking-widest uppercase text-white/80 group-hover:text-white">
                        {link.label}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-gym-red group-hover:translate-x-1 transition-all" />
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* MEMBERSHIP TAB (Plan Details) */}
          {activeTab === "membership" && (
            <motion.div
              key="membership"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            >
              <motion.h2
                variants={itemVariants}
                className="text-4xl font-black uppercase tracking-tighter mb-10 bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent"
              >
                My Plans
              </motion.h2>

              {membership ? (
                <div className="space-y-8">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white/50">Current Plan</h3>
                  <motion.div
                    variants={itemVariants}
                    className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl relative"
                  >
                    <div className="bg-[#080808] rounded-[15px] p-8 space-y-8 relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-gym-red/10 blur-[60px] rounded-full pointer-events-none"></div>

                      <div className="relative z-10 flex justify-between items-start border-b border-white/5 pb-8">
                        <div>
                          <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-2">
                            Plan
                          </p>
                          <p className="text-2xl font-black tracking-tight">
                            {membership.package_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-2">
                            Status
                          </p>
                          <StatusBadge status={membership.status} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8 relative z-10 border-b border-white/5 pb-8">
                        <div>
                          <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-2">
                            Start Date
                          </p>
                          <p className="text-sm font-bold tracking-wider">
                            {formatTimestamp(membership.start_date)}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-2">
                            End Date
                          </p>
                          <p className="text-sm font-bold tracking-wider">
                            {formatTimestamp(membership.end_date)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8 relative z-10">
                        <div>
                          <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-2">
                            Amount
                          </p>
                          <p className="text-2xl font-black text-gym-red">
                            {formatCurrency(membership.amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-2">
                            Next Due Date
                          </p>
                          <p className="text-sm font-bold tracking-wider">
                            {formatTimestamp(membership.next_due_date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <motion.div
                  variants={itemVariants}
                  className="glass-card p-12 text-center"
                >
                  <p className="text-white/50 font-bold uppercase tracking-widest mb-4">
                    No membership found
                  </p>
                  <button
                    onClick={() => navigate("/member/membership")}
                    className="bg-gym-red text-white px-8 py-3 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2"
                  >
                    Choose a Plan <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {upcomingMembership && (
                <div className="space-y-8 mt-12">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white/50">Upcoming Plan</h3>
                  <motion.div
                    variants={itemVariants}
                    className="bg-gradient-to-b from-blue-500/20 to-transparent p-[1px] rounded-2xl relative"
                  >
                    <div className="bg-[#080808] rounded-[15px] p-8 space-y-8 relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none"></div>

                      <div className="relative z-10 flex justify-between items-start border-b border-white/5 pb-8">
                        <div>
                          <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-2">
                            Plan
                          </p>
                          <p className="text-2xl font-black tracking-tight">
                            {upcomingMembership.package_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-2">
                            Status
                          </p>
                          <StatusBadge status={upcomingMembership.status} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8 relative z-10 border-b border-white/5 pb-8">
                        <div>
                          <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-2">
                            Start Date
                          </p>
                          <p className="text-sm font-bold tracking-wider">
                            {formatTimestamp(upcomingMembership.start_date)}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-2">
                            End Date
                          </p>
                          <p className="text-sm font-bold tracking-wider">
                            {formatTimestamp(upcomingMembership.end_date)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8 relative z-10">
                        <div>
                          <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-2">
                            Amount
                          </p>
                          <p className="text-2xl font-black text-white">
                            {formatCurrency(upcomingMembership.amount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}

          {/* FEES TAB */}
          {activeTab === "fees" && (
            <motion.div
              key="fees"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            >
              <motion.h2
                variants={itemVariants}
                className="text-4xl font-black uppercase tracking-tighter mb-10 bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent"
              >
                Payment History
              </motion.h2>

              <motion.button
                variants={itemVariants}
                onClick={() => navigate("/member/membership")}
                className="w-full bg-gym-red hover:bg-white hover:text-black text-white font-black text-sm uppercase tracking-widest py-5 rounded-xl shadow-[0_0_30px_rgba(255,51,51,0.3)] transition-all duration-300 flex justify-center items-center gap-2 mb-10"
              >
                PAY NOW SECURELY
              </motion.button>

              <motion.div variants={itemVariants}>
                <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
                  Transaction History
                </h3>
                {payments.length > 0 ? (
                  <div className="space-y-4">
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="bg-gradient-to-r from-[#0a0a0a] to-[#080808] border border-white/5 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between hover:border-white/20 transition-all duration-300 shadow-lg group"
                      >
                        <div className="mb-4 md:mb-0">
                          <p className="font-black text-lg mb-1 tracking-wider text-white/90 group-hover:text-white transition-colors">
                            {formatCurrency(payment.amount)}
                          </p>
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                            {formatTimestamp(payment.payment_date || payment.created_at)} •{" "}
                            {payment.package_name}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <StatusBadge status={payment.status} />
                          {payment.status === 'rejected' && payment.rejection_reason && (
                            <span className="text-[9px] text-red-500 max-w-[200px] text-right break-words line-clamp-2">
                              {payment.rejection_reason}
                            </span>
                          )}
                          <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">
                            {payment.method}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-card p-12 text-center">
                    <p className="text-white/50 font-bold uppercase tracking-widest">
                      No payments yet
                    </p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* RECEIPTS TAB */}
          {activeTab === "receipts" && (
            <motion.div
              key="receipts"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            >
              <motion.h2
                variants={itemVariants}
                className="text-4xl font-black uppercase tracking-tighter mb-10 bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent"
              >
                Receipts
              </motion.h2>

              <motion.div variants={itemVariants}>
                <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
                  Verified Payments
                </h3>
                {payments.filter((p) => p.status === "verified").length > 0 ? (
                  <div className="space-y-4">
                    {payments
                      .filter((p) => p.status === "verified")
                      .map((payment) => (
                        <div
                          key={payment.id}
                          className="bg-gradient-to-r from-[#0a0a0a] to-[#080808] border border-white/5 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between hover:border-white/20 transition-all duration-300 shadow-lg group"
                        >
                          <div className="mb-4 md:mb-0">
                            <p className="font-black text-lg mb-1 tracking-wider text-white/90 group-hover:text-white transition-colors">
                              {formatCurrency(payment.amount)}
                            </p>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
                              {formatTimestamp(payment.payment_date || payment.created_at)} •{" "}
                              {payment.package_name}
                            </p>
                            <p className="text-[10px] text-white/30 font-mono">
                              TXN: {payment.provider_payment_id || payment.id}
                            </p>
                          </div>
                          <button
                            onClick={() => navigate(`/member/receipt/${payment.id}`)}
                            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors"
                          >
                            <Download className="w-4 h-4" /> Receipt
                          </button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="glass-card p-12 text-center">
                    <p className="text-white/50 font-bold uppercase tracking-widest mb-2">
                      No receipts available
                    </p>
                    <p className="text-xs text-white/30">
                      Receipts will appear here after your payment is verified by an administrator.
                    </p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* MORE TAB */}
          {activeTab === "more" && (
            <motion.div
              key="more"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            >
              <motion.h2
                variants={itemVariants}
                className="text-4xl font-black uppercase tracking-tighter mb-10 bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent"
              >
                My Profile
              </motion.h2>

              <motion.div
                variants={itemVariants}
                className="bg-gradient-to-br from-gym-red/30 to-transparent p-[1px] rounded-2xl mb-8"
              >
                <div className="bg-[#080808]/90 backdrop-blur-xl rounded-[15px] p-8 relative overflow-hidden shadow-2xl flex items-center gap-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gym-red/20 blur-[50px] rounded-full pointer-events-none"></div>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gym-red to-red-900 p-[2px] shadow-[0_0_20px_rgba(255,51,51,0.4)] flex-shrink-0">
                    <div className="w-full h-full bg-[#0a0a0a] rounded-full flex items-center justify-center overflow-hidden">
                      <User className="w-8 h-8 text-white/50" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-wider">
                      {memberName}
                    </h2>
                    <p className="text-white/40 text-[10px] font-mono tracking-widest mt-1">
                      {memberCode}
                    </p>
                    <p className="text-white/30 text-[10px] tracking-widest mt-1">
                      {user?.email}
                    </p>
                    {user?.member?.mobile && (
                      <p className="text-white/30 text-[10px] tracking-widest mt-0.5">
                        +91 {user.member.mobile}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="mb-12">
                <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Account
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      icon: Shield,
                      title: "Privacy & Security",
                      desc: "Manage your password",
                    },
                    {
                      icon: HelpCircle,
                      title: "Help & Support",
                      desc: "Contact gym admin",
                    },
                    { icon: Info, title: "About FitZone", desc: "Version 2.0" },
                  ].map((opt, i) => (
                    <div
                      key={i}
                      className="group bg-gradient-to-r from-[#0a0a0a] to-[#080808] hover:from-[#111] hover:to-[#0a0a0a] border border-white/5 hover:border-gym-red/30 p-5 rounded-xl flex items-center justify-between cursor-pointer transition-all duration-300 shadow-lg"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-10 h-10 rounded-lg bg-white/5 group-hover:bg-gym-red/10 flex items-center justify-center transition-colors">
                          <opt.icon className="w-5 h-5 text-white/50 group-hover:text-gym-red transition-colors" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold tracking-wider text-white/90 group-hover:text-white">
                            {opt.title}
                          </h4>
                          <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">
                            {opt.desc}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-gym-red group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.button
                variants={itemVariants}
                onClick={handleLogout}
                className="w-full flex items-center justify-center p-5 bg-[#0a0a0a] hover:bg-gym-red/10 border border-white/5 hover:border-gym-red/50 rounded-xl transition-all duration-300 group text-gym-red shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  <span className="font-black text-xs uppercase tracking-widest">
                    Sign Out
                  </span>
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MemberDashboard;
