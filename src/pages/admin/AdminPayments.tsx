import { useState, useEffect } from "react";
import { IndianRupee, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { getAllPayments, verifyPayment, rejectPayment } from "../../services/paymentService";
import { type Payment } from "../../lib/supabase-types";
import { formatTimestamp, formatCurrency } from "../../utils/dateUtils";
import StatusBadge from "../../components/ui/StatusBadge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";
import BackButton from "../../components/ui/BackButton";

const AdminPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const p = await getAllPayments();
      setPayments(p);
    } catch (error) {
      console.error("Failed to load payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (paymentId: string) => {
    if (!confirm("Are you sure you want to verify this payment and activate the membership?")) return;
    setProcessingId(paymentId);
    try {
      await verifyPayment(paymentId);
      await loadData();
    } catch (error) {
      console.error("Failed to verify payment:", error);
      alert("Failed to verify payment");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    const reason = prompt("Enter rejection reason (e.g. Invalid Transaction ID):");
    if (reason === null) return;
    if (!reason.trim()) {
      alert("Rejection reason is required.");
      return;
    }
    
    setProcessingId(paymentId);
    try {
      await rejectPayment(paymentId, reason);
      await loadData();
    } catch (error) {
      console.error("Failed to reject payment:", error);
      alert("Failed to reject payment");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredPayments =
    filter === "all" ? payments : payments.filter((p) => p.status === filter);

  const totalRevenue = payments
    .filter((p) => p.status === "verified")
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) return <LoadingSpinner message="Loading payments..." />;

  return (
    <div className="min-h-screen bg-[#030303] text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <BackButton to="/admin" label="BACK TO DASHBOARD" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2">
              Monitor <span className="text-gym-red">Payments</span>
            </h2>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
              Total Verified Revenue: {formatCurrency(totalRevenue)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {["all", "submitted", "verified", "rejected", "pending"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                filter === f
                  ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                  : "bg-[#0a0a0a] border border-white/5 text-white/50 hover:text-white hover:border-white/20"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Payments Table */}
        <div className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl">
          <div className="bg-[#080808] rounded-[15px] overflow-hidden shadow-2xl">
            <div className="hidden md:grid grid-cols-6 gap-4 p-6 border-b border-white/5 bg-[#0a0a0a] text-[9px] font-bold uppercase tracking-widest text-white/40">
              <div className="col-span-2">Member / Package</div>
              <div>Amount</div>
              <div>Status / Info</div>
              <div>Date</div>
              <div className="text-right">Actions</div>
            </div>

            {filteredPayments.length > 0 ? (
              <div className="divide-y divide-white/5">
                {filteredPayments.map((payment, i) => (
                  <motion.div
                    key={payment.id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.05, 0.5) }}
                    className="grid grid-cols-1 md:grid-cols-6 gap-4 p-5 items-center hover:bg-[#111] transition-colors"
                  >
                    <div className="col-span-1 md:col-span-2">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-white">
                        {/* If we had member name joined, it would go here. Using package for now */}
                        {payment.package_name}
                      </h3>
                      <p className="text-[10px] text-white/40 font-mono">
                        TXN: {payment.provider_payment_id || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="font-black text-lg text-white/90">
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                    <div>
                      <div className="flex flex-col items-start gap-2">
                        <StatusBadge status={payment.status} />
                        {payment.status === 'rejected' && payment.rejection_reason && (
                          <span className="text-[9px] text-red-500 max-w-[200px] break-words line-clamp-2">
                            {payment.rejection_reason}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold tracking-wider">
                        {formatTimestamp(
                          payment.payment_date || payment.created_at,
                          "dd MMM yyyy, hh:mm a"
                        )}
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      {payment.status === "submitted" && (
                        <>
                          <button
                            onClick={() => handleVerify(payment.id)}
                            disabled={processingId === payment.id}
                            className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 p-2 rounded transition-colors disabled:opacity-50"
                            title="Verify Payment"
                          >
                            {processingId === payment.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleReject(payment.id)}
                            disabled={processingId === payment.id}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 p-2 rounded transition-colors disabled:opacity-50"
                            title="Reject Payment"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState icon={IndianRupee} title="No payments found" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;
