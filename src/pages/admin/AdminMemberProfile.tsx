import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  CreditCard,
  Calendar,
  Mail,
  Phone,
  PauseCircle,
  PlayCircle,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import { getMemberByUid } from "../../services/memberService";
import {
  getCurrentMembership,
  getUpcomingMembership,
  pauseReminders,
  resumeReminders,
} from "../../services/membershipService";
import {
  getMemberPayments,
  createManualPayment,
} from "../../services/paymentService";
import { getAllPackages } from "../../services/packageService";
import {
  type Profile,
  type Membership,
  type Payment,
  type Package,
} from "../../lib/supabase-types";
import {
  formatTimestamp,
  formatCurrency,
  getMembershipStatus,
  getDaysRelativeToDue,
} from "../../utils/dateUtils";
import StatusBadge from "../../components/ui/StatusBadge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import BackButton from "../../components/ui/BackButton";

const AdminMemberProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<Profile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [upcomingMembership, setUpcomingMembership] = useState<Membership | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi">("cash");
  const [paymentReference, setPaymentReference] = useState("");

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [m, ms, ums, p, pkgs] = await Promise.all([
        getMemberByUid(id!),
        getCurrentMembership(id!),
        getUpcomingMembership(id!),
        getMemberPayments(id!),
        getAllPackages(),
      ]);
      setMember(m);
      setMembership(ms);
      setUpcomingMembership(ums);
      setPayments(p);
      setPackages(pkgs);
    } catch (error) {
      console.error("Error loading member profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseReminders = async (days: number) => {
    if (!membership?.id) return;
    setActionLoading(true);
    try {
      const until = new Date();
      until.setDate(until.getDate() + days);
      await pauseReminders(
        membership.id,
        until,
        `Paused for ${days} days by admin`,
      );
      await loadData();
    } catch (error) {
      console.error("Failed to pause reminders:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeReminders = async () => {
    if (!membership?.id) return;
    setActionLoading(true);
    try {
      await resumeReminders(membership.id);
      await loadData();
    } catch (error) {
      console.error("Failed to resume reminders:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualRenewal = async () => {
    if (!member || !selectedPackage) return;
    setActionLoading(true);
    try {
      await createManualPayment({
        memberId: member.id,
        amount: selectedPackage.price,
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        method: paymentMethod,
        reference: paymentReference,
      });
      setShowRenewModal(false);
      setSelectedPackage(null);
      setPaymentReference("");
      await loadData();
    } catch (error) {
      console.error("Failed to process manual renewal:", error);
      alert("Failed to process manual renewal. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading member..." />;
  if (!member)
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center text-white">
        Member not found
      </div>
    );

  const status = membership
    ? getMembershipStatus(
        new Date(membership.end_date),
        new Date(membership.next_due_date),
      )
    : "inactive";
  const renderMembershipBlock = (mem: Membership, title: string, isUpcoming = false) => {
    const dRel = getDaysRelativeToDue(new Date(mem.next_due_date));
    return (
      <div className="space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-white/50">{title}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">
              Package
            </p>
            <p className="font-bold tracking-wider">
              {mem.package_name}
            </p>
          </div>
          <div>
            <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">
              Amount
            </p>
            <p className={`font-bold tracking-wider ${isUpcoming ? 'text-blue-500' : 'text-gym-red'}`}>
              {formatCurrency(mem.amount)}
            </p>
          </div>
          <div>
            <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">
              {isUpcoming ? 'Starts on' : 'Valid Until'}
            </p>
            <p className="font-bold tracking-wider">
              {formatTimestamp(isUpcoming ? mem.start_date : mem.end_date)}
            </p>
          </div>
          <div>
            <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">
              {isUpcoming ? 'Ends on' : 'Next Due'}
            </p>
            <p className="font-bold tracking-wider">
              {formatTimestamp(isUpcoming ? mem.end_date : mem.next_due_date)}
            </p>
            {!isUpcoming && dRel > 0 && (
              <p className="text-[9px] text-white/30">
                {dRel} days left
              </p>
            )}
            {!isUpcoming && dRel < 0 && (
              <p className="text-[9px] text-red-500">
                {Math.abs(dRel)} days overdue
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <BackButton to="/admin/members" label="BACK TO MEMBERS" />

        {/* Member Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-gym-red/30 to-transparent p-[1px] rounded-2xl mb-8"
        >
          <div className="bg-[#080808]/90 rounded-[15px] p-8 flex flex-col md:flex-row items-start md:items-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gym-red/10 blur-[60px] rounded-full pointer-events-none"></div>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gym-red to-red-900 p-[2px] flex-shrink-0">
              <div className="w-full h-full bg-[#0a0a0a] rounded-full flex items-center justify-center overflow-hidden">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-white/50" />
                )}
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-1">
                {member.full_name}
              </h1>
              <p className="text-white/40 text-[10px] font-mono tracking-widest mb-3">
                {member.member_code}
              </p>
              <div className="flex flex-wrap gap-4 text-[10px] font-bold tracking-widest text-white/50">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {member.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {member.mobile}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Joined{" "}
                  {formatTimestamp(member.created_at)}
                </span>
              </div>
            </div>
            <StatusBadge status={status} size="md" />
          </div>
        </motion.div>

        {/* Membership Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl mb-8"
        >
          <div className="bg-[#080808] rounded-[15px] p-8">
            <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
              <CreditCard className="w-4 h-4 text-gym-red" /> Membership
            </h2>

            {membership ? (
              <div className="space-y-8">
                {renderMembershipBlock(membership, "Current Plan")}

                {upcomingMembership && (
                  <div className="border-t border-white/5 pt-6">
                    {renderMembershipBlock(upcomingMembership, "Upcoming Plan", true)}
                  </div>
                )}

                {/* Manual Renewal Action */}
                <div className="border-t border-white/5 pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold tracking-wider">
                        Manual Renewal
                      </p>
                      <p className="text-[10px] text-white/40">
                        Record an offline payment (Cash/UPI)
                      </p>
                    </div>
                    <button
                      onClick={() => setShowRenewModal(true)}
                      className="bg-gym-red hover:bg-white hover:text-black text-white border border-gym-red px-4 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all"
                    >
                      Renew Manually
                    </button>
                  </div>
                </div>

                {/* Reminder Status & Actions */}
                <div className="border-t border-white/5 pt-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                      {membership.reminder_status === "paused" ? (
                        <>
                          <PauseCircle className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="text-sm font-bold tracking-wider">
                              Reminders Paused
                            </p>
                            {membership.reminder_paused_until && (
                              <p className="text-[10px] text-white/40">
                                Until{" "}
                                {formatTimestamp(
                                  membership.reminder_paused_until,
                                )}
                              </p>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-5 h-5 text-green-500" />
                          <p className="text-sm font-bold tracking-wider">
                            Reminders Active
                          </p>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {membership.reminder_status === "paused" ? (
                        <button
                          onClick={handleResumeReminders}
                          disabled={actionLoading}
                          className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 px-4 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all disabled:opacity-50"
                        >
                          Resume Reminders
                        </button>
                      ) : (
                        <>
                          {[7, 15, 30, 60, 90].map((days) => (
                            <button
                              key={days}
                              onClick={() => handlePauseReminders(days)}
                              disabled={actionLoading}
                              className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20 px-3 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all disabled:opacity-50"
                            >
                              Hold {days}d
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-white/50 text-sm font-bold uppercase tracking-widest mb-4">
                  No active membership
                </p>
                <button
                  onClick={() => setShowRenewModal(true)}
                  className="bg-gym-red hover:bg-white hover:text-black text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all"
                >
                  Start New Membership
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Payment History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl"
        >
          <div className="bg-[#080808] rounded-[15px] p-8">
            <h2 className="text-sm font-black uppercase tracking-widest mb-6">
              Payment History
            </h2>

            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[#0a0a0a] rounded-xl border border-white/5 gap-4"
                  >
                    <div>
                      <p className="font-bold text-sm tracking-wider">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1 mb-1">
                        {formatTimestamp(payment.payment_date || payment.created_at)} •{" "}
                        {payment.package_name}
                      </p>
                      <p className="text-[10px] text-white/30 font-mono">
                        TXN: {payment.provider_payment_id || payment.id}
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
              <p className="text-white/50 text-sm font-bold uppercase tracking-widest text-center py-8">
                No payments recorded
              </p>
            )}
          </div>
        </motion.div>

        {/* Manual Renewal Modal */}
        {showRenewModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <h3 className="text-lg font-black uppercase tracking-widest mb-6">
                Manual Renewal
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
                    Select Package
                  </label>
                  <select
                    className="w-full bg-[#111] border border-white/10 rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-gym-red"
                    onChange={(e) => {
                      const pkg = packages.find((p) => p.id === e.target.value);
                      setSelectedPackage(pkg || null);
                    }}
                    value={selectedPackage?.id || ""}
                  >
                    <option value="">-- Choose Package --</option>
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {formatCurrency(p.price)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPackage && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
                        Payment Method
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPaymentMethod("cash")}
                          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg border ${
                            paymentMethod === "cash"
                              ? "bg-white text-black border-white"
                              : "bg-[#111] text-white/50 border-white/10 hover:border-white/30"
                          }`}
                        >
                          Cash
                        </button>
                        <button
                          onClick={() => setPaymentMethod("upi")}
                          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg border ${
                            paymentMethod === "upi"
                              ? "bg-white text-black border-white"
                              : "bg-[#111] text-white/50 border-white/10 hover:border-white/30"
                          }`}
                        >
                          UPI
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
                        Reference ID / Note (Optional)
                      </label>
                      <input
                        type="text"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder={
                          paymentMethod === "upi"
                            ? "e.g. UTR Number"
                            : "e.g. Receipt #123"
                        }
                        className="w-full bg-[#111] border border-white/10 rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-gym-red placeholder:text-white/20"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowRenewModal(false)}
                  className="flex-1 bg-[#111] hover:bg-[#222] text-white py-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors border border-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualRenewal}
                  disabled={!selectedPackage || actionLoading}
                  className="flex-1 bg-gym-red hover:bg-white hover:text-black text-white py-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "Processing..." : "Confirm Renewal"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMemberProfile;
