import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Loader2,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Copy,
  Smartphone,
  Monitor,
  Clock,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  createPendingCheckout,
  submitPaymentProof,
  getPaymentById,
  type CheckoutResult,
} from "../../services/paymentService";
import { type Payment } from "../../lib/supabase-types";
import { formatCurrency } from "../../utils/dateUtils";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import BackButton from "../../components/ui/BackButton";

const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const packageId = searchParams.get("packageId");
  const existingPaymentId = searchParams.get("paymentId");

  const [checkout, setCheckout] = useState<CheckoutResult | null>(null);
  const [existingPayment, setExistingPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [step, setStep] = useState<"checkout" | "payment">("checkout");
  const [copied, setCopied] = useState<"upi" | "details" | null>(null);
  const [upiAttempted, setUpiAttempted] = useState(false);
  const [isMobile] = useState(() =>
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  );
  const navigate = useNavigate();
  const submitLock = useRef(false);

  const upiId =
    import.meta.env.VITE_FITZONE_UPI_ID || "rohithkannan362-1@okaxis";
  const upiName = import.meta.env.VITE_FITZONE_UPI_NAME || "FitZone";

  useEffect(() => {
    if (existingPaymentId) {
      loadExistingPayment(existingPaymentId);
    } else if (packageId) {
      initializeCheckout();
    } else {
      navigate("/member/membership");
    }
  }, [packageId, existingPaymentId]);

  const loadExistingPayment = async (pid: string) => {
    try {
      const p = await getPaymentById(pid);
      setExistingPayment(p);
    } catch (e: any) {
      setError(e.message || "Failed to load payment");
    } finally {
      setLoading(false);
    }
  };

  const initializeCheckout = async () => {
    try {
      const result = await createPendingCheckout(packageId!);
      setCheckout(result);
      if (result.existing) {
        setStep("payment");
      }
    } catch (error: any) {
      console.error("Failed to initialize checkout:", error);
      setError(error.message || "Failed to initialize checkout");
    } finally {
      setLoading(false);
    }
  };

  const getUpiIntentUrl = (amount: number) => {
    const am = amount.toFixed(2);
    return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${am}&cu=INR&tn=${encodeURIComponent("FitZone")}`;
  };

  const handleOpenUpiApp = (amount: number) => {
    setUpiAttempted(true);
    if (!isMobile) return; // Desktop: just show the informative message
    window.location.href = getUpiIntentUrl(amount);
  };

  const copyToClipboard = async (text: string, type: "upi" | "details") => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLock.current) return;
    if (!checkout || !transactionId.trim()) {
      setError("Please enter a valid UPI Transaction ID / UTR number.");
      return;
    }
    submitLock.current = true;
    setIsProcessing(true);
    setError("");
    try {
      await submitPaymentProof(
        checkout.payment_id,
        transactionId.trim(),
        new Date()
      );
      setSubmitted(true);
      navigate(`/member/payment/success?paymentId=${checkout.payment_id}`);
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(
        err.message || "Failed to submit payment proof. Please try again."
      );
      submitLock.current = false;
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading)
    return <LoadingSpinner fullScreen message="Initializing checkout..." />;

  // ─── Show existing payment state ───────────────────────────────────────────
  if (existingPayment) {
    const p = existingPayment;
    const statusConfig: Record<
      string,
      { Icon: any; color: string; label: string; sub: string }
    > = {
      submitted: {
        Icon: Clock,
        color: "text-blue-500",
        label: "PAYMENT SUBMITTED",
        sub: "Awaiting Admin Verification",
      },
      verified: {
        Icon: CheckCircle2,
        color: "text-green-500",
        label: "PAYMENT VERIFIED",
        sub: "Your membership is active",
      },
      rejected: {
        Icon: XCircle,
        color: "text-red-500",
        label: "PAYMENT REJECTED",
        sub: p.rejection_reason || "Please contact the gym.",
      },
      pending: {
        Icon: IndianRupee,
        color: "text-yellow-500",
        label: "PAYMENT PENDING",
        sub: "Complete your UPI payment and submit the UTR number.",
      },
    };
    const s = statusConfig[p.status] ?? statusConfig.pending;
    const { Icon } = s;
    return (
      <div className="min-h-screen bg-[#030303] text-white py-12 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="max-w-lg mx-auto relative z-10">
          <BackButton to="/member/dashboard" label="BACK TO DASHBOARD" />
          <div className="glass-card p-8 border-t-4 border-t-gym-red mt-8">
            <div className="text-center mb-6">
              <Icon className={`w-16 h-16 ${s.color} mx-auto mb-4`} />
              <h2 className="text-2xl font-black uppercase tracking-widest">
                {s.label}
              </h2>
              <p className="text-white/50 text-sm mt-2">{s.sub}</p>
            </div>
            <div className="space-y-3 border-t border-white/10 pt-6">
              <div className="flex justify-between">
                <span className="text-white/40 text-xs uppercase tracking-wider">
                  Amount
                </span>
                <span className="font-bold">{formatCurrency(p.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40 text-xs uppercase tracking-wider">
                  Package
                </span>
                <span className="font-bold text-sm">{p.package_name}</span>
              </div>
              {p.provider_payment_id && (
                <div className="flex justify-between">
                  <span className="text-white/40 text-xs uppercase tracking-wider">
                    UPI Ref
                  </span>
                  <span className="font-mono text-sm">
                    {p.provider_payment_id}
                  </span>
                </div>
              )}
            </div>
            {p.status === "rejected" && (
              <button
                onClick={() => navigate("/member/membership")}
                className="btn-primary w-full mt-6"
              >
                Choose a New Plan
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!checkout && !error) return null;

  const amount = checkout?.amount ?? 0;
  const upiUrl = getUpiIntentUrl(amount);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUrl)}`;
  const paymentDetails = `Pay ₹${amount.toFixed(2)} to ${upiName}\nUPI ID: ${upiId}`;

  return (
    <div className="min-h-screen bg-[#030303] text-white py-8 md:py-20 px-4 md:px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gym-red/5 rounded-full mix-blend-screen filter blur-[200px] opacity-40 pointer-events-none" />

      <div className="max-w-lg mx-auto relative z-10">
        <BackButton to="/member/membership" label="CHANGE PLAN" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-3">
            Secure <span className="text-gym-red">Checkout</span>
          </h1>
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest">
            {step === "checkout"
              ? "Step 1 of 2 — Review"
              : "Step 2 of 2 — Payment"}
          </p>
        </motion.div>

        {error && (
          <div className="bg-gym-red/10 border border-gym-red/30 text-gym-red text-sm p-4 text-center font-bold tracking-wider uppercase mb-6 rounded flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── STEP 1: Review ──────────────────────────────────────────── */}
        {checkout && step === "checkout" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 border-t-4 border-t-gym-red mb-8"
          >
            <h2 className="text-lg font-black uppercase tracking-widest mb-8 border-b border-white/10 pb-4 flex justify-between items-center">
              <span>{checkout.package_name}</span>
              {checkout.existing && (
                <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">
                  PENDING PAYMENT
                </span>
              )}
            </h2>

            <div className="space-y-6 mb-8">
              <div className="flex justify-between items-center bg-white/5 p-4 rounded">
                <div className="flex items-center gap-3">
                  <IndianRupee className="w-5 h-5 text-white" />
                  <span className="text-sm font-bold uppercase tracking-wider text-white">
                    Total Amount
                  </span>
                </div>
                <span className="text-2xl font-black text-gym-red">
                  {formatCurrency(amount)}
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
                    <span className="font-bold">
                      +{checkout.free_months} Months
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm border-t border-white/10 pt-3">
                  <span className="text-white/60">Total Access</span>
                  <span className="font-bold text-lg">
                    {checkout.total_months} Months
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep("payment")}
              className="btn-primary w-full flex items-center justify-center gap-3 text-lg py-5"
            >
              CONTINUE TO PAYMENT
            </button>
          </motion.div>
        )}

        {/* ── STEP 2: Payment ─────────────────────────────────────────── */}
        {checkout && step === "payment" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* UPI Payment Card */}
            <div className="glass-card p-6 md:p-8 border-t-4 border-t-gym-red">
              <div className="text-center space-y-5">
                <div>
                  <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1">
                    Payable Amount
                  </h3>
                  <div className="text-4xl font-black text-gym-red">
                    {formatCurrency(amount)}
                  </div>
                </div>

                {/* QR Code */}
                <div className="bg-white p-4 rounded-xl inline-block shadow-lg">
                  <img
                    src={qrUrl}
                    alt="UPI QR Code"
                    className="w-52 h-52 mx-auto"
                    loading="lazy"
                  />
                </div>

                <p className="text-xs text-white/40 font-bold uppercase tracking-widest">
                  Scan with any UPI app to pay
                </p>

                {/* UPI ID row */}
                <div className="bg-white/5 rounded-lg p-4 text-left space-y-1">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                    UPI ID
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <p
                      id="upi-id-display"
                      className="font-mono text-white text-sm select-all break-all"
                    >
                      {upiId}
                    </p>
                    <button
                      id="copy-upi-id-btn"
                      onClick={() => copyToClipboard(upiId, "upi")}
                      className="shrink-0 p-2 rounded bg-white/10 hover:bg-white/20 transition-colors"
                      aria-label="Copy UPI ID"
                    >
                      {copied === "upi" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-white/60" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-white/40">{upiName}</p>
                </div>

                {/* Copy payment details */}
                <button
                  id="copy-payment-details-btn"
                  onClick={() => copyToClipboard(paymentDetails, "details")}
                  className="w-full py-3 rounded border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copied === "details" ? "Copied!" : "Copy Payment Details"}
                </button>

                {/* Open UPI App */}
                <div className="space-y-3">
                  <button
                    id="open-upi-app-btn"
                    onClick={() => handleOpenUpiApp(amount)}
                    aria-label="Open UPI App"
                    data-upi-url={upiUrl}
                    className="w-full py-4 rounded font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 bg-gradient-to-r from-gym-red to-red-700 hover:from-red-600 hover:to-red-800 text-white shadow-[0_0_20px_rgba(255,51,51,0.3)]"
                  >
                    {isMobile ? (
                      <Smartphone className="w-5 h-5" />
                    ) : (
                      <Monitor className="w-5 h-5" />
                    )}
                    Open UPI App
                  </button>

                  {/* Desktop fallback */}
                  {upiAttempted && !isMobile && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-left"
                    >
                      <p className="text-yellow-400 text-sm font-bold mb-1">
                        UPI apps can only be opened on supported mobile devices.
                      </p>
                      <p className="text-white/50 text-xs">
                        On desktop, scan the QR code or copy the UPI ID and pay
                        via your UPI app on your phone.
                      </p>
                    </motion.div>
                  )}

                  {/* Mobile fallback hint */}
                  {upiAttempted && isMobile && (
                    <p className="text-white/40 text-xs text-center">
                      If no UPI app opened, scan the QR code or copy the UPI ID
                      above.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Proof Submission Form */}
            <form
              onSubmit={handleSubmitProof}
              className="glass-card p-6 md:p-8 border-t-4 border-t-blue-500"
            >
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                <h3 className="text-sm font-black uppercase tracking-widest text-white">
                  Already paid via UPI?
                </h3>
              </div>
              <p className="text-white/50 text-sm leading-relaxed mb-6">
                After completing your payment in Google Pay, PhonePe, Paytm, or
                another UPI app, enter the UPI Transaction ID / UTR number
                below.
              </p>

              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="utr-input"
                    className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2"
                  >
                    UPI Transaction ID / UTR Number
                  </label>
                  <input
                    id="utr-input"
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. 312345678901"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-gym-red font-mono text-sm"
                    required
                    minLength={4}
                    maxLength={50}
                    disabled={isProcessing || submitted}
                    autoComplete="off"
                  />
                  <p className="text-[10px] text-white/30 mt-2">
                    The 12-digit reference number shown in your UPI app after a
                    successful payment.
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-blue-200 text-xs leading-relaxed">
                    ⏳ Your membership will be activated after the gym
                    administrator verifies the transaction.
                  </p>
                </div>

                <button
                  id="submit-proof-btn"
                  type="submit"
                  disabled={isProcessing || submitted || !transactionId.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white w-full py-4 rounded font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-3 text-sm min-h-[56px]"
                >
                  {isProcessing ? (
                    <>
                      Submitting <Loader2 className="w-5 h-5 animate-spin" />
                    </>
                  ) : submitted ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" /> Submitted
                    </>
                  ) : (
                    "Submit for Verification"
                  )}
                </button>

                <p className="text-[10px] text-white/20 text-center uppercase tracking-widest">
                  Status after submission: Payment Submitted → Awaiting Admin
                  Verification
                </p>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
