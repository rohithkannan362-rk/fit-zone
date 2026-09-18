import { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, Loader2, ChevronLeft, Calendar, IndianRupee } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getPackageById } from '../../services/packageService';
import { getCurrentMembership, createMembership, renewMembership, activateMembership } from '../../services/membershipService';
import { createPaymentRecord, updatePayment } from '../../services/paymentService';
import { type Package } from '../../lib/firestore-schema';
import { calculateEndDate, calculateNextDueDate, formatDate, formatCurrency } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const packageId = searchParams.get('packageId');
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!packageId) {
      navigate('/member/membership');
      return;
    }
    loadPackage();
  }, [packageId]);

  const loadPackage = async () => {
    try {
      const p = await getPackageById(packageId!);
      if (!p) {
        navigate('/member/membership');
        return;
      }
      setPkg(p);
    } catch (error) {
      console.error('Failed to load package:', error);
      setError('Failed to load package details');
    } finally {
      setLoading(false);
    }
  };

  const startDate = new Date();
  const endDate = pkg ? calculateEndDate(startDate, pkg.durationMonths) : new Date();
  const nextDueDate = calculateNextDueDate(endDate);

  const handlePayment = async () => {
    if (!pkg || !user?.uid) return;

    setIsProcessing(true);
    setError('');

    try {
      // 1. Check for existing membership to determine if this is a renewal
      const currentMembership = await getCurrentMembership(user.uid);

      // 2. Create or renew membership
      let membershipId: string;
      if (currentMembership) {
        membershipId = await renewMembership({
          memberId: user.uid,
          packageId: pkg.id!,
          packageName: pkg.name,
          amount: pkg.price,
          durationMonths: pkg.durationMonths,
          previousMembershipId: currentMembership.id!,
          createdBy: user.uid,
        });
      } else {
        membershipId = await createMembership({
          memberId: user.uid,
          packageId: pkg.id!,
          packageName: pkg.name,
          amount: pkg.price,
          durationMonths: pkg.durationMonths,
          createdBy: user.uid,
        });
      }

      // 3. Create payment record
      // In production, this would call a Cloud Function to create a Razorpay order
      // For now, we create a payment record directly
      const paymentId = await createPaymentRecord({
        memberId: user.uid,
        membershipId,
        amount: pkg.price,
        packageId: pkg.id!,
        packageName: pkg.name,
        provider: 'razorpay',
        providerOrderId: `order_${Date.now()}`,
        createdBy: user.uid,
      });

      // 4. In production: Open Razorpay checkout here
      // For now, simulate payment success
      // The webhook would normally handle this

      await updatePayment(paymentId, {
        status: 'success',
        providerPaymentId: `pay_${Date.now()}`,
        paymentDate: Timestamp.now(),
        method: 'upi',
      });

      await activateMembership(membershipId);

      // 5. Navigate to success page
      navigate(`/member/payment/success?paymentId=${paymentId}&membershipId=${membershipId}`);

    } catch (err: any) {
      console.error('Payment error:', err);
      setError('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading payment..." />;

  if (!pkg) return null;

  return (
    <div className="min-h-screen bg-[#030303] text-white py-20 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gym-red/5 rounded-full mix-blend-screen filter blur-[200px] opacity-40 pointer-events-none"></div>

      <Link to="/member/membership" className="absolute top-8 left-8 text-white/50 hover:text-white flex items-center gap-2 transition-colors z-20">
        <ChevronLeft className="w-5 h-5" />
        <span className="font-bold tracking-widest text-sm uppercase">Back</span>
      </Link>

      <div className="max-w-lg mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-3">
            FIT ZONE <span className="text-gym-red">Membership</span>
          </h1>
          <p className="text-white/50 text-sm font-bold uppercase tracking-widest">
            Secure Payment
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 border-t-4 border-t-gym-red mb-8"
        >
          <h2 className="text-lg font-black uppercase tracking-widest mb-8 border-b border-white/10 pb-4">
            {pkg.name} Membership
          </h2>

          <div className="space-y-6 mb-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3 text-white/60">
                <IndianRupee className="w-4 h-4" />
                <span className="text-sm font-bold uppercase tracking-wider">Amount</span>
              </div>
              <span className="text-3xl font-black">{formatCurrency(pkg.price)}</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3 text-white/60">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-bold uppercase tracking-wider">Validity</span>
              </div>
              <span className="text-sm font-bold tracking-wider">
                {formatDate(startDate)} → {formatDate(endDate)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3 text-white/60">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-bold uppercase tracking-wider">Next Due</span>
              </div>
              <span className="text-sm font-bold tracking-wider text-gym-red">
                {formatDate(nextDueDate)}
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-gym-red/10 border border-gym-red/30 text-gym-red text-sm p-4 text-center font-bold tracking-wider uppercase mb-6">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-start gap-3 text-white/40 text-xs mb-6">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-400" />
              <p>Secure UPI Payment. Your payment will be verified automatically by our payment gateway.</p>
            </div>

            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-lg py-5"
            >
              {isProcessing ? (
                <>Processing <Loader2 className="w-5 h-5 animate-spin" /></>
              ) : (
                <>PAY {formatCurrency(pkg.price)}</>
              )}
            </button>

            <Link
              to="/member/membership"
              className="block w-full text-center py-4 text-xs font-bold text-white/40 hover:text-white uppercase tracking-widest"
            >
              Change Plan
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentPage;
