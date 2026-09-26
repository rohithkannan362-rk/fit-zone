import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMemberPayments } from "../../services/paymentService";
import { type Payment } from "../../lib/supabase-types";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency, formatTimestamp } from "../../utils/dateUtils";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { Printer, ArrowLeft } from "lucide-react";

const MemberReceipt = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid && id) {
      loadPayment();
    }
  }, [user, id]);

  const loadPayment = async () => {
    try {
      const payments = await getMemberPayments(user!.uid);
      const found = payments.find((p) => p.id === id);
      if (found) {
        setPayment(found);
      }
    } catch (error) {
      console.error("Failed to load receipt:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <LoadingSpinner message="Loading receipt..." />;

  if (!payment) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-black uppercase mb-4">Receipt Not Found</h2>
        <button
          onClick={() => navigate("/member/dashboard")}
          className="text-gym-red hover:text-white uppercase font-bold text-xs"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white p-4 sm:p-6 md:p-12 pb-24 md:pb-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8 print:hidden">
          <button
            onClick={() => navigate("/member/dashboard")}
            className="flex items-center gap-2 text-white/50 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={handlePrint}
            className="bg-gym-red hover:bg-white hover:text-black text-white px-5 sm:px-6 py-2.5 sm:py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all w-full sm:w-auto min-h-[44px]"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>

        <div className="bg-white text-black p-5 sm:p-8 md:p-12 rounded-2xl print:p-0 print:rounded-none shadow-2xl">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-black/10 pb-6 sm:pb-8 mb-6 sm:mb-8 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-gym-red mb-1">FIT ZONE</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/50">Official Receipt</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/50 mb-1">Receipt Number</p>
              <p className="font-mono text-xs sm:text-sm">{payment.id.split('-')[0].toUpperCase()}</p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 sm:gap-8 mb-8 sm:mb-12">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/50 mb-1">Billed To</p>
              <p className="font-bold text-xs sm:text-sm uppercase">{user?.member?.full_name || "Member"}</p>
              {user?.member?.member_code && (
                <p className="font-mono text-[10px] sm:text-xs mt-1">{user.member.member_code}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/50 mb-1">Date</p>
              <p className="font-bold text-xs sm:text-sm">{formatTimestamp(payment.payment_date || payment.created_at)}</p>
            </div>
          </div>

          {/* Items */}
          <div className="border border-black/10 rounded-xl overflow-hidden mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/5">
                  <th className="py-3 px-4 sm:py-4 sm:px-6 text-[10px] font-bold uppercase tracking-widest text-black/50">Description</th>
                  <th className="py-3 px-4 sm:py-4 sm:px-6 text-[10px] font-bold uppercase tracking-widest text-black/50 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-black/10">
                  <td className="py-4 px-4 sm:py-6 sm:px-6 font-bold text-xs sm:text-sm">{payment.package_name}</td>
                  <td className="py-4 px-4 sm:py-6 sm:px-6 font-bold text-xs sm:text-sm text-right">{formatCurrency(payment.amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex justify-end mb-8 sm:mb-12">
            <div className="w-full max-w-full sm:max-w-xs space-y-3 sm:space-y-4">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="font-bold text-black/50 uppercase tracking-widest text-[10px]">Method</span>
                <span className="font-bold uppercase">{payment.method}</span>
              </div>
              {payment.provider_payment_id && (
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="font-bold text-black/50 uppercase tracking-widest text-[10px]">Txn ID</span>
                  <span className="font-mono text-xs break-all">{payment.provider_payment_id}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t-2 border-black/10 pt-4">
                <span className="font-black uppercase tracking-widest text-sm">Total</span>
                <span className="font-black text-xl sm:text-2xl text-gym-red">{formatCurrency(payment.amount)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center border-t-2 border-black/10 pt-6 sm:pt-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">
              Thank you for choosing Fit Zone. This is a computer generated receipt.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberReceipt;
