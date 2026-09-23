import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { getPaymentById } from "../../services/paymentService";
import { type Payment } from "../../lib/supabase-types";
import { formatCurrency, formatTimestamp } from "../../utils/dateUtils";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [paymentId]);

  const loadData = async () => {
    try {
      if (paymentId) {
        const p = await getPaymentById(paymentId);
        setPayment(p);
      }
    } catch (error) {
      console.error("Failed to load payment data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner fullScreen message="Loading payment details..." />
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full mix-blend-screen filter blur-[200px] opacity-40 pointer-events-none"></div>

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-28 h-28 bg-blue-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(59,130,246,0.4)]"
      >
        <Clock className="text-white w-14 h-14" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-md w-full relative z-10"
      >
        <h1 className="text-3xl md:text-4xl font-black uppercase text-white mb-2 tracking-tighter">
          Payment <span className="text-blue-500">Submitted</span>
        </h1>
        <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-10">
          Awaiting Admin Verification
        </p>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mb-10 text-left">
          <p className="text-sm text-blue-200 leading-relaxed text-center mb-6">
            Your UPI transaction ID has been successfully submitted. Your membership will become active once an administrator verifies the payment.
          </p>

          {payment && (
            <div className="space-y-4 pt-6 border-t border-blue-500/20">
              <div className="flex justify-between items-center">
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                  Amount
                </span>
                <span className="text-lg font-black text-blue-400">
                  {formatCurrency(payment.amount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                  Package
                </span>
                <span className="font-bold text-sm tracking-wider">
                  {payment.package_name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                  UPI Ref
                </span>
                <span className="font-mono text-sm tracking-wider">
                  {payment.provider_payment_id}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                  Date
                </span>
                <span className="font-mono text-xs text-white/60">
                  {formatTimestamp(payment.payment_date || payment.created_at)}
                </span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate("/member/dashboard")}
          className="bg-gym-red hover:bg-red-600 text-white px-10 py-5 rounded text-sm font-bold uppercase tracking-widest transition-all duration-300 shadow-[0_0_30px_rgba(255,51,51,0.4)] inline-flex items-center gap-3 w-full justify-center"
        >
          Go to Dashboard <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
