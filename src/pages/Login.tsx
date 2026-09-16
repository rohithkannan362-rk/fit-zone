import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, ShieldCheck, Loader2, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  
  const { login, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = new URLSearchParams(location.search).get('type') === 'admin';

  useEffect(() => {
    if (user) {
      if (isAdmin && user.role === 'admin') {
        navigate('/admin');
      } else if (!isAdmin && user.role !== 'admin') {
        navigate('/dashboard');
      }
    }
  }, [user, navigate, isAdmin]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    if (isAdmin && phone !== '9999999999') {
      setError('Invalid Master Passcode. Use 9999999999 for Admin Access.');
      return;
    }
    if (!isAdmin && phone === '9999999999') {
      setError('This number is reserved for Admin. Please use your registered member phone number.');
      return;
    }
    setError('');
    // Simulate sending OTP
    setOtpSent(true);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError('Please enter a valid OTP');
      return;
    }
    
    const success = await login(phone, otp);
    if (!success) {
      setError('Invalid OTP. Try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gym-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      
      {/* Background aesthetics */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gym-red rounded-full mix-blend-screen filter blur-[200px] opacity-10 pointer-events-none"></div>
      
      <Link to="/" className="absolute top-8 left-8 text-white/50 hover:text-white flex items-center gap-2 transition-colors z-20">
        <ChevronLeft className="w-5 h-5" />
        <span className="font-bold tracking-widest text-sm uppercase">Return</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card w-full max-w-md p-10 relative z-10 border-t-4 border-t-gym-red"
      >
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="mb-8 bg-white p-3 rounded-lg shadow-2xl transform -rotate-2">
            <img src="/logo.jpg" alt="FIT ZONE" className="h-16 w-auto object-contain" />
          </div>

          <h2 className="text-4xl font-black text-white font-heading uppercase tracking-tighter">
            {isAdmin ? (
              <>Admin <span className="text-gym-red">Portal</span></>
            ) : (
              <>Enter The <span className="text-gym-red">Zone</span></>
            )}
          </h2>
          <p className="text-white/50 text-sm mt-4 tracking-wider uppercase font-medium">
            {otpSent 
              ? 'Authenticate Your Identity' 
              : isAdmin 
                ? 'Gym Owner Access Only' 
                : 'Verify Your Membership'
            }
          </p>
        </div>

        {error && (
          <div className="bg-gym-red/10 border border-gym-red/30 text-gym-red text-sm p-4 text-center font-bold tracking-wider uppercase mb-8">
            {error}
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-6">
            <div>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 font-bold tracking-widest">+91</span>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="PHONE NUMBER"
                  className="w-full bg-gym-charcoal border-2 border-white/10 py-4 pl-16 pr-5 text-white font-bold tracking-widest focus:outline-none focus:border-gym-red transition-colors placeholder:text-white/20 uppercase"
                />
              </div>
            </div>
            
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-3">
              Proceed <ArrowRight className="w-5 h-5" />
            </button>
            
            <div className="mt-6 text-center border-t border-white/10 pt-6">
              <p className="text-xs text-white/40 font-medium tracking-widest uppercase mb-4">
                {isAdmin ? 'Master Passcode Required' : 'OTP will be sent to this number'}
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="flex flex-col gap-6">
            <div>
              <input 
                type="text" 
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="ENTER OTP"
                className="w-full bg-gym-charcoal border-2 border-white/10 py-4 px-5 text-white font-black text-center tracking-[0.5em] text-xl focus:outline-none focus:border-gym-red transition-colors placeholder:text-white/20 placeholder:tracking-widest"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              {isLoading ? 'VERIFYING...' : 'CONFIRM ACCESS'}
            </button>
            
            <button 
              type="button" 
              onClick={() => { setOtpSent(false); setOtp(''); setError(''); }}
              className="text-white/40 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors mt-6 text-center w-full"
            >
              Change Phone Number
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
