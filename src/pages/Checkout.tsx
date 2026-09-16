import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, CreditCard, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const plans = [
  { id: '1m', duration: '1 Month', offer: null, price: 1000 },
  { id: '3m', duration: '3 Months', offer: '1 Month Free', price: 3000, popular: true },
  { id: '6m', duration: '6 Months', offer: '4 Months Free', price: 7000 },
  { id: '12m', duration: '12 Months', offer: '6 Months Free', price: 10000 },
];

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, user } = useAuth();
  
  const searchParams = new URLSearchParams(location.search);
  const name = searchParams.get('name') || '';
  const phone = searchParams.get('phone') || '';
  const initialPlanId = searchParams.get('plan') || '3m';
  
  const [selectedPlan, setSelectedPlan] = useState(initialPlanId);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // If accessed directly without name/phone, bounce back to register
  React.useEffect(() => {
    if (!name || !phone) {
      navigate('/register');
    }
  }, [name, phone, navigate]);

  const activePlan = plans.find(p => p.id === selectedPlan) || plans[1];

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Mocking Razorpay Payment Delay
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    setIsProcessing(false);
    setPaymentSuccess(true);
    
    const currentUserRole = user?.role;

    if (currentUserRole !== 'admin') {
      // Auto login the newly registered user after success
      await login(phone, '1234'); // using mock OTP
    }
    
    // Redirect to dashboard after showing success
    setTimeout(() => {
      if (currentUserRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }, 2000);
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gym-black flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(34,197,94,0.4)]"
        >
          <CheckCircle2 className="text-white w-16 h-16" />
        </motion.div>
        <h1 className="text-5xl font-black uppercase text-white mb-4">Payment Successful!</h1>
        <p className="text-white/60 font-bold uppercase tracking-widest">Welcome to FIT ZONE, {name}</p>
        <p className="text-white/40 font-bold text-xs uppercase mt-8 animate-pulse">Redirecting to Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gym-black py-20 px-6">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">Complete <span className="text-gym-red">Registration</span></h1>
            <p className="text-white/50 font-bold tracking-widest text-sm uppercase">Step 2: Choose Plan & Checkout</p>
          </div>
          <div className="hidden md:block bg-white/5 px-4 py-2 border border-white/10">
            <span className="text-white/40 text-xs font-bold uppercase tracking-widest mr-2">User:</span>
            <span className="text-white font-bold uppercase">{name} ({phone})</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Plan Selection */}
          <div className="space-y-4">
            <h2 className="text-white text-lg font-black uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Select Membership</h2>
            {plans.map((plan) => (
              <div 
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative p-6 cursor-pointer border-2 transition-all duration-300 ${
                  selectedPlan === plan.id ? 'bg-gym-red/10 border-gym-red' : 'bg-gym-charcoal border-white/5 hover:border-white/20'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gym-red text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1">
                    Most Popular
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black uppercase text-white">{plan.duration}</h3>
                    {plan.offer && <p className="text-gym-orange text-xs font-bold uppercase tracking-widest mt-1">{plan.offer}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-white">₹{plan.price.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout Summary */}
          <div>
            <div className="glass-card p-8 border-t-4 border-t-gym-red sticky top-8">
              <h2 className="text-white text-lg font-black uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-white/70 font-medium">
                  <span>{activePlan.duration} Membership</span>
                  <span>₹{activePlan.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-white/70 font-medium">
                  <span>Registration Fee</span>
                  <span>₹500</span>
                </div>
                <div className="flex justify-between text-gym-red font-bold">
                  <span>Special Waiver applied</span>
                  <span>- ₹500</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6 mb-8 flex justify-between items-end">
                <span className="text-white/50 text-sm font-bold uppercase tracking-widest">Total Amount</span>
                <span className="text-4xl font-black text-white">₹{activePlan.price.toLocaleString()}</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 text-white/40 text-xs mb-6">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-400" />
                  <p>Secure SSL Encrypted transaction. By clicking pay, you agree to our Terms and Conditions.</p>
                </div>
                
                <button 
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>Processing <Loader2 className="w-5 h-5 animate-spin" /></>
                  ) : (
                    <>Pay ₹{activePlan.price.toLocaleString()} Securely <CreditCard className="w-5 h-5" /></>
                  )}
                </button>
                <Link to="/register" className="block w-full text-center py-4 text-xs font-bold text-white/40 hover:text-white uppercase tracking-widest">
                  Cancel & Return
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mock Razorpay Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="bg-white text-black p-8 rounded-lg max-w-sm w-full relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
              <div className="flex justify-between items-center border-b pb-4 mb-6">
                <div className="font-bold text-lg">Razorpay Mock</div>
                <div className="text-blue-500 font-bold">₹{activePlan.price.toLocaleString()}</div>
              </div>
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="font-medium text-gray-600 text-center">Processing payment with bank...<br/>Please do not close this window.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Checkout;
