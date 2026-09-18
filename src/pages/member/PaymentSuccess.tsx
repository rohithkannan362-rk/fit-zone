import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { getPaymentById } from '../../services/paymentService';
import { getMembershipById } from '../../services/membershipService';
import { type Payment, type Membership } from '../../lib/firestore-schema';
import { formatCurrency, formatTimestamp } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const membershipId = searchParams.get('membershipId');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [paymentId, membershipId]);

  const loadData = async () => {
    try {
      if (paymentId) {
        const p = await getPaymentById(paymentId);
        setPayment(p);
      }
      if (membershipId) {
        const m = await getMembershipById(membershipId);
        setMembership(m);
      }
    } catch (error) {
      console.error('Failed to load payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Verifying payment..." />;

  return (
    <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-green-500/10 rounded-full mix-blend-screen filter blur-[200px] opacity-40 pointer-events-none"></div>

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-28 h-28 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(34,197,94,0.4)]"
      >
        <CheckCircle2 className="text-white w-14 h-14" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-md w-full"
      >
        <h1 className="text-4xl font-black uppercase text-white mb-2">Payment Success</h1>
        <p className="text-white/50 text-sm font-bold uppercase tracking-widest mb-10">
          Welcome to FIT ZONE
        </p>

        <div className="glass-card p-8 text-left space-y-5 mb-10">
          {payment && (
            <>
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Amount Paid</span>
                <span className="text-2xl font-black text-green-500">{formatCurrency(payment.amount)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Package</span>
                <span className="font-bold text-sm tracking-wider">{payment.packageName}</span>
              </div>
            </>
          )}

          {membership && (
            <>
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Valid Until</span>
                <span className="font-bold text-sm tracking-wider">{formatTimestamp(membership.endDate)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Next Due</span>
                <span className="font-bold text-sm tracking-wider text-gym-red">{formatTimestamp(membership.nextDueDate)}</span>
              </div>
            </>
          )}

          {payment && (
            <div className="flex justify-between items-center">
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Payment ID</span>
              <span className="font-mono text-xs text-white/60">{payment.providerPaymentId || payment.id}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/member/dashboard')}
          className="bg-gym-red hover:bg-red-600 text-white px-10 py-5 text-sm font-bold uppercase tracking-widest transition-all duration-300 shadow-[0_0_30px_rgba(255,51,51,0.4)] inline-flex items-center gap-3 w-full justify-center"
        >
          Go to Dashboard <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
