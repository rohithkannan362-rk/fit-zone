import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Loader2,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  createPendingCheckout,
  submitPaymentProof,
  type CheckoutResult,
} from "../../services/paymentService";
import { formatCurrency } from "../../utils/dateUtils";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import BackButton from "../../components/ui/BackButton";

const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const packageId = searchParams.get("packageId");
  const [checkout, setCheckout] = useState<CheckoutResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [step, setStep] = useState<"checkout" | "payment">("checkout");
  const navigate = useNavigate();

  const upiId = import.meta.env.VITE_FITZONE_UPI_ID || "rohithkannan362-1@okaxis";
  const upiName = import.meta.env.VITE_FITZONE_UPI_NAME || "Rohith Kannan";

  useEffect(() => {
    if (!packageId) {
      navigate("/member/membership");
      return;
    }
    initializeCheckout();
  }, [packageId]);

  const initializeCheckout = async () => {
    try {
      const result = await createPendingCheckout(packageId!);
      setCheckout(result);
      if (result.existing) {
        // If they already started a checkout, jump straight to payment
        setStep("payment");
      }
    } catch (error: any) {
      console.error("Failed to initialize checkout:", error);
      setError(error.message || "Failed to initialize checkout");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToPayment = () => {
    setStep("payment");
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkout || !transactionId.trim()) {
      setError("Please enter a valid transaction ID");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      await submitPaymentProof(
        checkout.payment_id,
        transactionId.trim(),
        new Date()
      );
      navigate(`/member/payment/success?paymentId=${checkout.payment_id}`);
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err.message || "Failed to submit payment proof. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getUpiIntentUrl = () => {
    if (!checkout) return "";
    const am = checkout.amount.toFixed(2);
    const tn = `FitZone-${checkout.payment_id}`;
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${am}&cu=INR&tn=${tn}`;
  };

  if (loading)
    return <LoadingSpinner fullScreen message="Initializing checkout..." />;

  if (!checkout && !error) return null;

  return (
    <div className="min-h-screen bg-[#030303] text-white py-12 md:py-20 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gym-red/5 rounded-full mix-blend-screen filter blur-[200px] opacity-40 pointer-events-none"></div>

      <div className="max-w-lg mx-auto relative z-10">
        <BackButton to="/member/membership" label="CHANGE PLAN" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-3">
            Secure <span className="text-gym-red">Checkout</span>
          </h1>
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest">
            {step === "checkout" ? "Step 1 of 2: Review" : "Step 2 of 2: Payment"}
          </p>
        </motion.div>

        {error && (
          <div className="bg-gym-red/10 border border-gym-red/30 text-gym-red text-sm p-4 text-center font-bold tracking-wider uppercase mb-6 rounded flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {checkout && step === "checkout" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 border-t-4 border-t-gym-red mb-8"
          >
            <h2 className="text-lg font-black uppercase tracking-widest mb-8 border-b border-white/10 pb-4 flex justify-between items-center">
              <span>{checkout.package_name}</span>
              {checkout.existing && (
                <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">PENDING PAYMENT</span>
              )}
            </h2>

            <div className="space-y-6 mb-8">
              <div className="flex justify-between items-center bg-white/5 p-4 rounded">
                <div className="flex items-center gap-3 text-white/60">
                  <IndianRupee className="w-5 h-5 text-white" />
                  <span className="text-sm font-bold uppercase tracking-wider text-white">
                    Total Amount
                  </span>
                </div>
                <span className="text-2xl font-black text-gym-red">
                  {formatCurrency(checkout.amount)}
                </span>
              </div>

              <div className="space-y-3 px-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/60">Paid Duration</span>
                  <span className="font-bold">{checkout.paid_months} Months</span>
                </div>
                {checkout.free_months > 0 && (
                  <div className="flex justify-between items-center text-sm text-green-400">
                    <span>Free Months</span>
                    <span className="font-bold">+{checkout.free_months} Months</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm border-t border-white/10 pt-3">
                  <span className="text-white/60">Total Access</span>
                  <span className="font-bold text-lg">{checkout.total_months} Months</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <button
                onClick={handleContinueToPayment}
                className="btn-primary w-full flex items-center justify-center gap-3 text-lg py-5"
              >
                CONTINUE TO PAYMENT
              </button>
            </div>
          </motion.div>
        )}

        {checkout && step === "payment" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Payment Instructions / QR */}
            <div className="glass-card p-8 border-t-4 border-t-gym-red">
              <div className="text-center space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-1">Payable Amount</h3>
                  <div className="text-4xl font-black text-gym-red">
                    {formatCurrency(checkout.amount)}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl inline-block">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getUpiIntentUrl())}`}
                    alt="UPI QR Code"
                    className="w-48 h-48 mx-auto"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-white/60">Scan QR or click below to pay via UPI</p>
                  <p className="font-mono bg-white/5 py-2 px-4 rounded text-sm select-all">
                    {upiId}
                  </p>
                  <p className="text-xs text-white/40">{upiName}</p>
                </div>

                <a
                  href={getUpiIntentUrl()}
                  className="bg-white/10 hover:bg-white/20 text-white w-full py-4 rounded font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  Open UPI App
                </a>
              </div>
            </div>

            {/* Submission Form */}
            <form onSubmit={handleSubmitProof} className="glass-card p-8 border-t-4 border-t-blue-500">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                Submit Payment Proof
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
                    UPI Transaction ID / UTR Number
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. 312345678901"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-gym-red font-mono"
                    required
                    minLength={4}
                    maxLength={50}
                  />
                  <p className="text-[10px] text-white/40 mt-2">
                    Enter the 12-digit reference number from your UPI app after successful payment.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || !transactionId.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full py-4 rounded font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      Submitting <Loader2 className="w-5 h-5 animate-spin" />
                    </>
                  ) : (
                    "Submit for Verification"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
