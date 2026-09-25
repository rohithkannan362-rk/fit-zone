import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCurrentMembership, getUpcomingMembership } from "../../services/membershipService";
import { getMemberPayments } from "../../services/paymentService";
import { type Membership, type Payment } from "../../lib/supabase-types";
import { supabase } from "../../lib/supabaseClient";
import {
  formatTimestamp,
  formatCurrency,
  getDaysRelativeToDue,
} from "../../utils/dateUtils";
import { uploadUserAvatar, removeUserAvatar } from "../../utils/avatarUtils";
import StatusBadge from "../../components/ui/StatusBadge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import {
  LogOut,
  CreditCard,
  FileText,
  ChevronRight,
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
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  Lock,
  Eye,
  EyeOff,
  Edit3,
  Save,
  User,
  Camera,
  Trash2,
  Copy,
  Check,
  Activity,
  MapPin,
  Target,
  Dumbbell,
  ShieldCheck,
  Award,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function calculateAge(dobString?: string | null): number | null {
  if (!dobString) return null;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

function calculateBmi(heightCm?: number | string | null, weightKg?: number | string | null): { value: string; label: string; color: string; badgeColor: string } | null {
  if (!heightCm || !weightKg) return null;
  const h = Number(heightCm) / 100;
  const w = Number(weightKg);
  if (h <= 0 || w <= 0 || isNaN(h) || isNaN(w)) return null;
  const bmi = w / (h * h);
  const rounded = bmi.toFixed(1);
  if (bmi < 18.5) return { value: rounded, label: "Underweight", color: "text-blue-400", badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
  if (bmi < 25) return { value: rounded, label: "Healthy Weight", color: "text-green-400", badgeColor: "bg-green-500/20 text-green-400 border-green-500/30" };
  if (bmi < 30) return { value: rounded, label: "Overweight", color: "text-yellow-400", badgeColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
  return { value: rounded, label: "Obese", color: "text-gym-red", badgeColor: "bg-red-500/20 text-gym-red border-red-500/30" };
}

const MemberDashboard = () => {
  const { user, logout, syncProfileData } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [activePanel, setActivePanel] = useState<null | "edit-profile" | "privacy" | "help">(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [upcomingMembership, setUpcomingMembership] = useState<Membership | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarSuccess, setAvatarSuccess] = useState(false);
  // Profile editing
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editEmergencyName, setEditEmergencyName] = useState("");
  const [editEmergencyPhone, setEditEmergencyPhone] = useState("");
  const [editBloodGroup, setEditBloodGroup] = useState("");
  const [editFitnessGoal, setEditFitnessGoal] = useState("Muscle Building");
  const [editHeight, setEditHeight] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editBio, setEditBio] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);
  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const isGoogleUser = useRef(false);

  useEffect(() => {
    if (user?.uid) {
      loadData();
      // detect google users by checking if they have no password provider
      supabase.auth.getUser().then(({ data }) => {
        const identities = data?.user?.identities ?? [];
        isGoogleUser.current = identities.some((i) => i.provider === "google") &&
          !identities.some((i) => i.provider === "email");
      });
    }
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

  // Dynamic calculated stats
  const memberAge = useMemo(() => calculateAge(user?.member?.dob), [user?.member?.dob]);
  const memberBmi = useMemo(
    () => calculateBmi(user?.member?.height_cm, user?.member?.weight_kg),
    [user?.member?.height_cm, user?.member?.weight_kg]
  );
  const liveEditBmi = useMemo(
    () => calculateBmi(editHeight, editWeight),
    [editHeight, editWeight]
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleCopyMemberCode = () => {
    if (!memberCode) return;
    navigator.clipboard.writeText(memberCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const openEditProfile = () => {
    setEditName(user?.member?.full_name || "");
    setEditPhone(user?.member?.mobile || "");
    setEditGender(user?.member?.gender || "");
    setEditDob(user?.member?.dob || "");
    setEditAddress(user?.member?.address || "");
    setEditEmergencyName(user?.member?.emergency_contact_name || "");
    setEditEmergencyPhone(user?.member?.emergency_contact_phone || "");
    setEditBloodGroup(user?.member?.blood_group || "");
    setEditFitnessGoal(user?.member?.fitness_goal || "Muscle Building");
    setEditHeight(user?.member?.height_cm ? String(user?.member?.height_cm) : "");
    setEditWeight(user?.member?.weight_kg ? String(user?.member?.weight_kg) : "");
    setEditBio(user?.member?.bio || "");
    setProfileError("");
    setProfileSuccess(false);
    setActivePanel("edit-profile");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) { setProfileError("Full name is required."); return; }
    setSavingProfile(true);
    setProfileError("");
    setProfileSuccess(false);
    try {
      await syncProfileData({
        full_name: editName.trim(),
        mobile: editPhone.trim(),
        gender: editGender.trim() || undefined,
        dob: editDob || undefined,
        address: editAddress.trim() || undefined,
        emergency_contact_name: editEmergencyName.trim() || undefined,
        emergency_contact_phone: editEmergencyPhone.trim() || undefined,
        blood_group: editBloodGroup || undefined,
        fitness_goal: editFitnessGoal || undefined,
        height_cm: editHeight ? Number(editHeight) : undefined,
        weight_kg: editWeight ? Number(editWeight) : undefined,
        bio: editBio.trim() || undefined,
      });
      setProfileSuccess(true);
      setTimeout(() => {
        setProfileSuccess(false);
        setActivePanel(null);
      }, 1200);
    } catch (err: any) {
      setProfileError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setPwError("Passwords do not match."); return; }
    if (newPassword.length < 8) { setPwError("Password must be at least 8 characters."); return; }
    setSavingPw(true);
    setPwError("");
    setPwSuccess(false);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPwSuccess(true);
      setNewPassword(""); setConfirmPassword("");
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err: any) {
      setPwError(err.message || "Failed to change password.");
    } finally {
      setSavingPw(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError("");
    setAvatarSuccess(false);
    try {
      setUploadingAvatar(true);
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }
      const file = e.target.files[0];
      const { avatarUrl } = await uploadUserAvatar(file, user!.uid);
      await syncProfileData({ avatar_url: avatarUrl });
      setAvatarSuccess(true);
      setTimeout(() => setAvatarSuccess(false), 3000);
    } catch (error: any) {
      setAvatarError(error.message || "Error uploading avatar!");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.uid) return;
    setUploadingAvatar(true);
    setAvatarError("");
    try {
      await removeUserAvatar(user.uid);
      await syncProfileData({ avatar_url: "" });
      setAvatarSuccess(true);
      setTimeout(() => setAvatarSuccess(false), 2000);
    } catch (err: any) {
      setAvatarError(err.message || "Failed to remove photo.");
    } finally {
      setUploadingAvatar(false);
    }
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
      <main className={`${activeTab === "more" ? "max-w-5xl" : "max-w-2xl"} mx-auto px-4 md:px-8 pt-8 pb-16 relative z-10 min-h-[80vh] transition-all duration-300`}>
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

          {/* MORE / PROFILE TAB */}
          {activeTab === "more" && (
            <motion.div
              key="more"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <AnimatePresence mode="wait">
              {/* ── SUB-PANEL: Edit Profile ───────────────────────────────── */}
              {activePanel === "edit-profile" && (
                <motion.div
                  key="edit-profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-8">
                    <button
                      type="button"
                      onClick={() => setActivePanel(null)}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                      title="Back to profile"
                    >
                      <ArrowLeft className="w-5 h-5 text-white/80" />
                    </button>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
                        Edit Profile
                      </h2>
                      <p className="text-white/40 text-xs mt-0.5">
                        Update your personal details, physical stats, and fitness goals
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    {profileError && (
                      <div className="flex items-center gap-2 bg-gym-red/10 border border-gym-red/30 text-gym-red text-sm p-4 rounded-xl">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{profileError}</span>
                      </div>
                    )}
                    {profileSuccess && (
                      <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 text-sm p-4 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Profile changes saved successfully!</span>
                      </div>
                    )}

                    {/* Section 1: Basic Information */}
                    <div className="glass-card p-6 md:p-8 rounded-2xl relative overflow-hidden">
                      <div className="flex items-center gap-2 text-gym-red font-bold text-xs uppercase tracking-widest mb-6 pb-3 border-b border-white/5">
                        <User className="w-4 h-4" /> Basic Information
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-bold text-white/60 uppercase tracking-widest mb-2">
                            Full Name <span className="text-gym-red">*</span>
                          </label>
                          <input
                            id="edit-full-name"
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-gym-red transition-colors"
                            placeholder="Your full name"
                            required
                            minLength={2}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-white/60 uppercase tracking-widest mb-2">
                            Mobile Number <span className="text-gym-red">*</span>
                          </label>
                          <input
                            id="edit-phone"
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-gym-red transition-colors"
                            placeholder="e.g. 9876543210"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-white/60 uppercase tracking-widest mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={user?.email || ""}
                            readOnly
                            className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-white/40 cursor-not-allowed"
                          />
                          <p className="text-[10px] text-white/30 mt-1">Managed via account login.</p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-white/60 uppercase tracking-widest mb-2">
                            Gender
                          </label>
                          <select
                            id="edit-gender"
                            value={editGender}
                            onChange={(e) => setEditGender(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-gym-red transition-colors cursor-pointer"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Non-binary">Non-binary</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-white/60 uppercase tracking-widest mb-2">
                            Date of Birth
                          </label>
                          <input
                            id="edit-dob"
                            type="date"
                            value={editDob}
                            onChange={(e) => setEditDob(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-gym-red transition-colors [color-scheme:dark]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-white/60 uppercase tracking-widest mb-2">
                            Blood Group
                          </label>
                          <select
                            id="edit-blood-group"
                            value={editBloodGroup}
                            onChange={(e) => setEditBloodGroup(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-gym-red transition-colors cursor-pointer"
                          >
                            <option value="">Select Blood Group</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Fitness & Health Metrics */}
                    <div className="glass-card p-6 md:p-8 rounded-2xl relative overflow-hidden">
                      <div className="flex items-center gap-2 text-gym-red font-bold text-xs uppercase tracking-widest mb-6 pb-3 border-b border-white/5">
                        <Dumbbell className="w-4 h-4" /> Fitness & Health Metrics
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-white/60 uppercase tracking-widest mb-2">
                            Primary Fitness Goal
                          </label>
                          <select
                            id="edit-fitness-goal"
                            value={editFitnessGoal}
                            onChange={(e) => setEditFitnessGoal(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-gym-red transition-colors cursor-pointer"
                          >
                            <option value="Muscle Building">Muscle Building / Hypertrophy</option>
                            <option value="Weight Loss">Weight Loss & Fat Burn</option>
                            <option value="Strength & Power">Strength & Powerlifting</option>
                            <option value="Endurance & Cardio">Endurance & Cardio Stamina</option>
                            <option value="Flexibility & Mobility">Flexibility & Functional Mobility</option>
                            <option value="General Fitness">General Fitness & Wellness</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-white/60 uppercase tracking-widest mb-2">
                            Height (cm)
                          </label>
                          <input
                            id="edit-height"
                            type="number"
                            min="50"
                            max="250"
                            step="0.5"
                            value={editHeight}
                            onChange={(e) => setEditHeight(e.target.value)}
                            placeholder="e.g. 175"
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-gym-red transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-white/60 uppercase tracking-widest mb-2">
                            Weight (kg)
                          </label>
                          <input
                            id="edit-weight"
                            type="number"
                            min="20"
                            max="300"
                            step="0.5"
                            value={editWeight}
                            onChange={(e) => setEditWeight(e.target.value)}
                            placeholder="e.g. 70"
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-gym-red transition-colors"
                          />
                        </div>

                        {/* Live BMI Preview Card */}
                        <div className="md:col-span-2 bg-[#0c0c0c] border border-white/10 rounded-xl p-4 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">Calculated BMI</span>
                            <span className="text-xl font-black text-white">
                              {liveEditBmi ? `${liveEditBmi.value}` : "—"}
                            </span>
                          </div>
                          {liveEditBmi ? (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${liveEditBmi.badgeColor}`}>
                              {liveEditBmi.label}
                            </span>
                          ) : (
                            <span className="text-xs text-white/30 italic">Enter height & weight</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Emergency & Location */}
                    <div className="glass-card p-6 md:p-8 rounded-2xl relative overflow-hidden">
                      <div className="flex items-center gap-2 text-gym-red font-bold text-xs uppercase tracking-widest mb-6 pb-3 border-b border-white/5">
                        <MapPin className="w-4 h-4" /> Emergency Contact & Address
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-bold text-white/60 uppercase tracking-widest mb-2">
                            Emergency Contact Name
                          </label>
                          <input
                            id="edit-emergency-name"
                            type="text"
                            value={editEmergencyName}
                            onChange={(e) => setEditEmergencyName(e.target.value)}
                            placeholder="e.g. Spouse, Parent, Friend"
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-gym-red transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-white/60 uppercase tracking-widest mb-2">
                            Emergency Phone Number
                          </label>
                          <input
                            id="edit-emergency-phone"
                            type="tel"
                            value={editEmergencyPhone}
                            onChange={(e) => setEditEmergencyPhone(e.target.value)}
                            placeholder="e.g. 9876543211"
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-gym-red transition-colors"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-white/60 uppercase tracking-widest mb-2">
                            Residential Address / City
                          </label>
                          <input
                            id="edit-address"
                            type="text"
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                            placeholder="Street, Area, City, Pin Code"
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-gym-red transition-colors"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-white/60 uppercase tracking-widest mb-2">
                            Bio / Fitness Motivation
                          </label>
                          <textarea
                            id="edit-bio"
                            rows={3}
                            value={editBio}
                            onChange={(e) => setEditBio(e.target.value)}
                            placeholder="Share your personal motto or fitness aspiration..."
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-gym-red transition-colors resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-2">
                      <button
                        type="button"
                        onClick={() => setActivePanel(null)}
                        className="flex-1 py-4 rounded-xl border border-white/10 hover:border-white/30 text-white/70 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        id="save-profile-btn"
                        type="submit"
                        disabled={savingProfile}
                        className="flex-1 py-4 rounded-xl bg-gym-red hover:bg-red-600 text-white text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,51,51,0.3)] cursor-pointer"
                      >
                        {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {savingProfile ? "Saving Profile..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* ── SUB-PANEL: Privacy & Security ────────────────────────── */}
              {activePanel === "privacy" && (
                <motion.div
                  key="privacy"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-8">
                    <button
                      type="button"
                      onClick={() => setActivePanel(null)}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5 text-white/80" />
                    </button>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
                        Privacy & Security
                      </h2>
                      <p className="text-white/40 text-xs mt-0.5">Manage your credentials and account protection</p>
                    </div>
                  </div>

                  <div className="glass-card p-6 md:p-8 rounded-2xl space-y-6">
                    {isGoogleUser.current ? (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                        <p className="text-blue-300 text-sm font-bold mb-2 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4" /> Google Account Linked
                        </p>
                        <p className="text-white/60 text-xs leading-relaxed">
                          Your account uses Google Sign-In. Password updates and two-factor authentication are safely managed through your Google Account at myaccount.google.com.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleChangePassword} className="space-y-5">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-white/80 flex items-center gap-2">
                          <Lock className="w-4 h-4 text-gym-red" /> Update Password
                        </h3>
                        {pwError && (
                          <div className="flex items-center gap-2 bg-gym-red/10 border border-gym-red/30 text-gym-red text-sm p-3 rounded-xl">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{pwError}</span>
                          </div>
                        )}
                        {pwSuccess && (
                          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 text-sm p-3 rounded-xl">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>Password changed successfully!</span>
                          </div>
                        )}
                        <div className="relative">
                          <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">New Password</label>
                          <input
                            id="new-password"
                            type={showNewPw ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-white placeholder:text-white/20 focus:outline-none focus:border-gym-red transition-colors"
                            placeholder="New password (min 8 chars)"
                            minLength={8}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPw(!showNewPw)}
                            className="absolute right-4 top-10 text-white/30 hover:text-white transition-colors cursor-pointer"
                          >
                            {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Confirm Password</label>
                          <input
                            id="confirm-password"
                            type={showNewPw ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-gym-red transition-colors"
                            placeholder="Confirm new password"
                            required
                          />
                        </div>
                        <button
                          id="change-password-btn"
                          type="submit"
                          disabled={savingPw}
                          className="w-full py-4 rounded-xl bg-gym-red hover:bg-red-600 text-white text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,51,51,0.3)] cursor-pointer"
                        >
                          {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                          {savingPw ? "Updating..." : "Update Password"}
                        </button>
                      </form>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── SUB-PANEL: Help & Support ─────────────────────────────── */}
              {activePanel === "help" && (
                <motion.div
                  key="help"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-8">
                    <button
                      type="button"
                      onClick={() => setActivePanel(null)}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5 text-white/80" />
                    </button>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gym-red mb-0.5 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5" /> Help & Support
                      </span>
                      <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
                        Help & Support
                      </h2>
                      <p className="text-white/40 text-xs mt-0.5">Connect with the FitZone team for any inquiries</p>
                    </div>
                  </div>

                  <div className="glass-card p-6 md:p-8 rounded-2xl space-y-4">
                    <p className="text-white/60 text-sm mb-6">
                      Have questions regarding your membership, workout sessions, or payments? We are available 7 days a week.
                    </p>
                    {[
                      {
                        icon: Phone,
                        label: "Call Us",
                        value: import.meta.env.VITE_GYM_PHONE || "+91 98765 43210",
                        href: `tel:${import.meta.env.VITE_GYM_PHONE || "+919876543210"}`,
                        desc: "Mon–Sat, 6 AM – 10 PM",
                      },
                      {
                        icon: MessageCircle,
                        label: "WhatsApp",
                        value: "Chat with Admin",
                        href: `https://wa.me/${(import.meta.env.VITE_GYM_PHONE || "919876543210").replace(/[^0-9]/g, "")}`,
                        desc: "Instant replies & support on WhatsApp",
                      },
                      {
                        icon: Mail,
                        label: "Email",
                        value: import.meta.env.VITE_GYM_EMAIL || "admin@fitzone.com",
                        href: `mailto:${import.meta.env.VITE_GYM_EMAIL || "admin@fitzone.com"}`,
                        desc: "We respond within 24 hours",
                      },
                    ].map((item, i) => (
                      <a
                        key={i}
                        href={item.href}
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className="flex items-center gap-5 p-5 bg-[#0a0a0a] hover:bg-[#121212] border border-white/5 hover:border-gym-red/30 rounded-xl transition-all duration-300 group cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-xl bg-gym-red/10 flex items-center justify-center shrink-0 group-hover:bg-gym-red/20 transition-colors">
                          <item.icon className="w-5 h-5 text-gym-red" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{item.label}</p>
                          <p className="font-bold text-white text-sm mt-0.5">{item.value}</p>
                          <p className="text-[10px] text-white/30 mt-0.5">{item.desc}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-gym-red ml-auto group-hover:translate-x-1 transition-all" />
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── MAIN PROFILE VIEW ─────────────────────────────────────── */}
              {activePanel === null && (
                <motion.div
                  key="profile-main"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-8"
                >
                  {/* Top Bar Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-gym-red text-[11px] font-bold uppercase tracking-widest mb-1">
                        <Sparkles className="w-3.5 h-3.5" /> FitZone Athlete Profile
                      </div>
                      <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight bg-gradient-to-r from-white via-white/90 to-white/50 bg-clip-text text-transparent">
                        My Profile
                      </h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        id="edit-profile-btn"
                        onClick={openEditProfile}
                        className="px-5 py-3 rounded-xl bg-gym-red hover:bg-red-600 text-white text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 shadow-[0_0_20px_rgba(255,51,51,0.3)] cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" /> Edit Profile
                      </button>
                    </div>
                  </div>

                  {/* Avatar Toasts */}
                  {avatarError && (
                    <div className="flex items-center gap-2 bg-gym-red/10 border border-gym-red/30 text-gym-red text-sm p-4 rounded-xl">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{avatarError}</span>
                    </div>
                  )}
                  {avatarSuccess && (
                    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 text-sm p-4 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Profile picture updated successfully!</span>
                    </div>
                  )}

                  {/* HERO PROFILE CARD */}
                  <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-gym-red/40 via-white/10 to-transparent shadow-2xl">
                    <div className="bg-gradient-to-br from-[#121212] via-[#090909] to-[#040404] backdrop-blur-2xl rounded-[15px] p-6 md:p-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-80 h-80 bg-gym-red/15 blur-[90px] rounded-full pointer-events-none" />

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        {/* Avatar & Identifiers */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                          {/* Avatar with Camera Overlay & Remove */}
                          <div className="relative group shrink-0">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-[3px] bg-gradient-to-tr from-gym-red via-red-500 to-gym-orange shadow-[0_0_30px_rgba(255,51,51,0.4)]">
                              <div className="w-full h-full bg-[#0a0a0a] rounded-full flex items-center justify-center overflow-hidden relative">
                                {user?.member?.avatar_url ? (
                                  <img
                                    src={user.member.avatar_url}
                                    alt={memberName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <span className="text-3xl sm:text-4xl font-black text-white/80">
                                    {memberName.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Camera upload badge */}
                            <label
                              className="absolute bottom-0 right-0 w-9 h-9 bg-gym-red hover:bg-red-600 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-[0_0_15px_rgba(255,51,51,0.6)] border-2 border-[#090909]"
                              title="Upload new profile picture"
                            >
                              {uploadingAvatar ? (
                                <Loader2 className="w-4 h-4 text-white animate-spin" />
                              ) : (
                                <Camera className="w-4 h-4 text-white" />
                              )}
                              <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                className="hidden"
                                onChange={handleAvatarUpload}
                                disabled={uploadingAvatar}
                              />
                            </label>

                            {/* Delete avatar option */}
                            {user?.member?.avatar_url && (
                              <button
                                type="button"
                                onClick={handleRemoveAvatar}
                                disabled={uploadingAvatar}
                                className="absolute top-0 right-0 w-6 h-6 bg-black/80 hover:bg-gym-red text-white/70 hover:text-white rounded-full flex items-center justify-center transition-colors cursor-pointer border border-white/20"
                                title="Remove photo"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* Member Meta */}
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                                {memberName}
                              </h1>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/30 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                {membership?.status === "active" ? "Active Member" : (user?.role === "admin" ? "Admin" : "Member")}
                              </span>
                            </div>

                            {/* Member Code with Copy */}
                            <div className="flex items-center justify-center sm:justify-start gap-2">
                              <span className="text-xs font-mono font-bold tracking-wider text-white/60 bg-white/5 border border-white/10 px-3 py-1 rounded-lg">
                                ID: {memberCode || "FZ-MEMBER"}
                              </span>
                              {memberCode && (
                                <button
                                  type="button"
                                  onClick={handleCopyMemberCode}
                                  className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer"
                                  title="Copy member code"
                                >
                                  {copiedCode ? (
                                    <Check className="w-3.5 h-3.5 text-green-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                              {copiedCode && (
                                <span className="text-[10px] font-bold text-green-400">Copied!</span>
                              )}
                            </div>

                            {/* Verified & Mobile Badges */}
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-white/60">
                              <div className="flex items-center gap-1.5 text-green-400">
                                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                                <span className="font-semibold text-green-400/90">Verified Member</span>
                              </div>
                              {user?.member?.mobile && (
                                <div className="flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 text-gym-red shrink-0" />
                                  <span className="text-white/80">{user.member.mobile}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Member Since Badge */}
                        <div className="hidden lg:flex flex-col items-end text-right border-l border-white/5 pl-8">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
                            Membership Status
                          </span>
                          <span className="text-lg font-black text-white uppercase tracking-wider">
                            {membership ? membership.package_name : "Free / No Plan"}
                          </span>
                          <span className="text-xs text-white/40 mt-1">
                            Joined {user?.member?.created_at ? formatTimestamp(user.member.created_at) : "Recently"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4-KPI QUICK HIGHLIGHTS RIBBON */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* KPI 1: Active Plan */}
                    <div className="glass-card p-5 rounded-xl border border-white/10 relative overflow-hidden group">
                      <div className="flex items-center justify-between text-white/40 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Active Plan</span>
                        <IdCard className="w-4 h-4 text-gym-red" />
                      </div>
                      <p className="text-base sm:text-lg font-black text-white uppercase truncate">
                        {membership?.package_name || "No Plan"}
                      </p>
                      <p className="text-[11px] font-bold text-white/50 mt-1">
                        {membership ? `${getDaysRelativeToDue(new Date(membership.next_due_date))} days left` : "Explore memberships"}
                      </p>
                    </div>

                    {/* KPI 2: Fitness Goal */}
                    <div className="glass-card p-5 rounded-xl border border-white/10 relative overflow-hidden group">
                      <div className="flex items-center justify-between text-white/40 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Fitness Goal</span>
                        <Target className="w-4 h-4 text-gym-red" />
                      </div>
                      <p className="text-base sm:text-lg font-black text-white truncate">
                        {user?.member?.fitness_goal || "General Fitness"}
                      </p>
                      <p className="text-[11px] font-bold text-white/50 mt-1">Personal Focus</p>
                    </div>

                    {/* KPI 3: Body Composition / BMI */}
                    <div className="glass-card p-5 rounded-xl border border-white/10 relative overflow-hidden group">
                      <div className="flex items-center justify-between text-white/40 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Body Metrics</span>
                        <Activity className="w-4 h-4 text-gym-red" />
                      </div>
                      <p className="text-base sm:text-lg font-black text-white">
                        {memberBmi ? `${memberBmi.value} BMI` : (user?.member?.weight_kg ? `${user.member.weight_kg} kg` : "Not set")}
                      </p>
                      <p className={`text-[11px] font-bold mt-1 ${memberBmi ? memberBmi.color : "text-white/50"}`}>
                        {memberBmi ? memberBmi.label : "Set height & weight"}
                      </p>
                    </div>

                    {/* KPI 4: Emergency Contact */}
                    <div className="glass-card p-5 rounded-xl border border-white/10 relative overflow-hidden group">
                      <div className="flex items-center justify-between text-white/40 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Emergency Contact</span>
                        <ShieldCheck className="w-4 h-4 text-gym-red" />
                      </div>
                      <p className="text-base sm:text-lg font-black text-white truncate">
                        {user?.member?.emergency_contact_name || "Not specified"}
                      </p>
                      <p className="text-[11px] font-bold text-white/50 mt-1 truncate">
                        {user?.member?.emergency_contact_phone || "No phone added"}
                      </p>
                    </div>
                  </div>

                  {/* TWO-COLUMN DETAILS GRID */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Personal Information (2 cols on desktop) */}
                    <div className="lg:col-span-2 glass-card p-6 md:p-8 rounded-2xl border border-white/10 space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-white/10">
                        <div className="flex items-center gap-2.5">
                          <User className="w-5 h-5 text-gym-red" />
                          <h3 className="text-base font-black uppercase tracking-wider text-white">
                            Personal & Contact Details
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={openEditProfile}
                          className="text-xs font-bold text-gym-red hover:text-red-400 uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Full Name</p>
                          <p className="text-sm font-bold text-white mt-1">{user?.member?.full_name || "—"}</p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Mobile Phone</p>
                          <p className="text-sm font-bold text-white mt-1">{user?.member?.mobile || "—"}</p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Email Address</p>
                          <p className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                            {user?.email}
                            <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Verified</span>
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Gender</p>
                          <p className="text-sm font-bold text-white mt-1">{user?.member?.gender || "Not specified"}</p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Date of Birth</p>
                          <p className="text-sm font-bold text-white mt-1">
                            {user?.member?.dob ? `${formatTimestamp(user.member.dob)}` : "Not specified"}
                            {memberAge !== null ? ` (${memberAge} yrs)` : ""}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Blood Group</p>
                          <p className="text-sm font-bold text-white mt-1">
                            {user?.member?.blood_group ? (
                              <span className="px-2.5 py-0.5 bg-red-500/10 border border-red-500/30 text-gym-red rounded font-mono font-bold text-xs">
                                {user.member.blood_group}
                              </span>
                            ) : (
                              "Not specified"
                            )}
                          </p>
                        </div>

                        <div className="sm:col-span-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Emergency Contact</p>
                          <p className="text-sm font-bold text-white mt-1">
                            {user?.member?.emergency_contact_name ? (
                              <span>
                                {user.member.emergency_contact_name}{" "}
                                {user.member.emergency_contact_phone && (
                                  <span className="text-white/60 font-normal">({user.member.emergency_contact_phone})</span>
                                )}
                              </span>
                            ) : (
                              "Not specified"
                            )}
                          </p>
                        </div>

                        <div className="sm:col-span-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Residential Address</p>
                          <p className="text-sm font-bold text-white mt-1">{user?.member?.address || "Not specified"}</p>
                        </div>

                        <div className="sm:col-span-2 border-t border-white/5 pt-4">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">About / Fitness Bio</p>
                          <p className="text-xs text-white/70 italic mt-1 leading-relaxed">
                            {user?.member?.bio ? `"${user.member.bio}"` : "No bio added yet. Tell us about your fitness journey!"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Body Composition & Membership Quick View */}
                    <div className="space-y-6">
                      {/* Body Composition Card */}
                      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                          <Dumbbell className="w-5 h-5 text-gym-red" />
                          <h3 className="text-base font-black uppercase tracking-wider text-white">
                            Body Metrics
                          </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-[#0a0a0a] p-3.5 rounded-xl border border-white/5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block">Height</span>
                            <span className="text-base font-black text-white mt-0.5 block">
                              {user?.member?.height_cm ? `${user.member.height_cm} cm` : "—"}
                            </span>
                          </div>
                          <div className="bg-[#0a0a0a] p-3.5 rounded-xl border border-white/5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block">Weight</span>
                            <span className="text-base font-black text-white mt-0.5 block">
                              {user?.member?.weight_kg ? `${user.member.weight_kg} kg` : "—"}
                            </span>
                          </div>
                        </div>

                        {/* BMI Display */}
                        {memberBmi ? (
                          <div className="bg-gradient-to-br from-[#0c0c0c] to-[#060606] p-4 rounded-xl border border-white/5 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-white/50 uppercase tracking-wider">BMI Score</span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${memberBmi.badgeColor}`}>
                                {memberBmi.label}
                              </span>
                            </div>
                            <p className="text-2xl font-black text-white">{memberBmi.value}</p>
                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden flex">
                              <div className="bg-blue-400 h-full w-[25%]" title="Underweight (<18.5)" />
                              <div className="bg-green-400 h-full w-[35%]" title="Healthy (18.5-24.9)" />
                              <div className="bg-yellow-400 h-full w-[25%]" title="Overweight (25-29.9)" />
                              <div className="bg-gym-red h-full w-[15%]" title="Obese (30+)" />
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={openEditProfile}
                            className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-white/60 hover:text-white font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            + Add Height & Weight for BMI
                          </button>
                        )}
                      </div>

                      {/* Membership Snapshot */}
                      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                          <div className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-gym-red" />
                            <h3 className="text-base font-black uppercase tracking-wider text-white">
                              Membership
                            </h3>
                          </div>
                          {membership && <StatusBadge status={membership.status} size="sm" />}
                        </div>

                        {membership ? (
                          <div className="space-y-3">
                            <div>
                              <p className="text-lg font-black text-white">{membership.package_name}</p>
                              <p className="text-xs text-white/50 font-bold mt-0.5">{formatCurrency(membership.amount)}</p>
                            </div>
                            <div className="text-xs text-white/60 space-y-1">
                              <p>Expires: <span className="font-bold text-white">{formatTimestamp(membership.end_date)}</span></p>
                              <p>Next Due: <span className="font-bold text-gym-red">{formatTimestamp(membership.next_due_date)}</span></p>
                            </div>
                            <button
                              type="button"
                              onClick={() => navigate("/member/membership")}
                              className="w-full py-3 rounded-xl bg-white/5 hover:bg-gym-red/20 border border-white/10 hover:border-gym-red/40 text-white text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
                            >
                              Renew or Upgrade Plan
                            </button>
                          </div>
                        ) : (
                          <div className="text-center py-2 space-y-3">
                            <p className="text-xs text-white/50">You do not have an active membership plan currently.</p>
                            <button
                              type="button"
                              onClick={() => navigate("/member/membership")}
                              className="w-full py-3 rounded-xl bg-gym-red hover:bg-red-600 text-white text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
                            >
                              Explore Plans
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ACCOUNT MENU */}
                  <div>
                    <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <Settings className="w-4 h-4" /> Account & Preferences
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        {
                          icon: Shield,
                          title: "Privacy & Security",
                          desc: "Change password & authentication",
                          panel: "privacy" as const,
                        },
                        {
                          icon: HelpCircle,
                          title: "Help & Support",
                          desc: "Contact gym admin, call or WhatsApp",
                          panel: "help" as const,
                        },
                        {
                          icon: Info,
                          title: "About FitZone",
                          desc: "Version 2.0 • Premium Gym OS",
                          panel: null,
                        },
                      ].map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => opt.panel && setActivePanel(opt.panel)}
                          className="group bg-[#090909] hover:bg-[#111] border border-white/5 hover:border-gym-red/30 p-5 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-300 shadow-lg text-left"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-white/5 group-hover:bg-gym-red/10 flex items-center justify-center transition-colors shrink-0">
                              <opt.icon className="w-5 h-5 text-white/50 group-hover:text-gym-red transition-colors" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold tracking-wider text-white/90 group-hover:text-white">{opt.title}</h4>
                              <p className="text-[10px] text-white/40 mt-0.5">{opt.desc}</p>
                            </div>
                          </div>
                          {opt.panel && <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-gym-red group-hover:translate-x-1 transition-all" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SIGN OUT BUTTON */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center p-5 bg-[#0a0a0a] hover:bg-gym-red/10 border border-white/5 hover:border-gym-red/50 rounded-2xl transition-all duration-300 group text-gym-red shadow-lg cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                      <span className="font-black text-xs uppercase tracking-widest">Sign Out</span>
                    </div>
                  </button>
                </motion.div>
              )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MemberDashboard;
